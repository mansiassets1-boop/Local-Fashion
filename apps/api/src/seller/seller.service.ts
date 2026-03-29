import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DeliveryService } from '../delivery/delivery.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SellerService {
  constructor(
    private readonly db: DatabaseService,
    private readonly deliveryService: DeliveryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getSellerStore(userId: string) {
    const result = await this.db.query(
      "SELECT id, city_id FROM stores WHERE owner_user_id = $1 AND status = 'active'",
      [userId],
    );
    if (!result.rows[0]) throw new ForbiddenException('No active store found');
    return result.rows[0];
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async getOrders(userId: string, query: any) {
    const store = await this.getSellerStore(userId);
    const page = Math.max(1, +(query.page || 1));
    const limit = Math.min(50, +(query.limit || 20));
    const offset = (page - 1) * limit;
    const params: any[] = [store.id];
    const conditions = ['o.store_id = $1'];
    let idx = 2;

    if (query.status) {
      conditions.push(`o.status = $${idx++}`);
      params.push(query.status);
    }

    const result = await this.db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, o.accepted_at, o.ready_at,
              u.name AS buyer_name, u.phone AS buyer_phone,
              COUNT(oi.id) AS item_count,
              EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 AS mins_since_confirmed
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY o.id, u.name, u.phone
       ORDER BY o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset],
    );

    return { items: result.rows, page, limit };
  }

  async acceptOrder(orderId: string, userId: string) {
    await this.verifyStoreOwnsOrder(orderId, userId);
    const result = await this.db.query(
      `UPDATE orders SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1 AND status = 'confirmed' RETURNING *`,
      [orderId],
    );
    if (!result.rows[0]) throw new BadRequestException('Order not in confirmed status');

    const order = result.rows[0];
    await this.notificationsService.sendPush(
      order.buyer_id,
      'Order Accepted',
      'Your order has been accepted and is being prepared.',
      { order_id: orderId, type: 'order_accepted' },
    );

    return result.rows[0];
  }

  async rejectOrder(orderId: string, userId: string, reason?: string) {
    await this.verifyStoreOwnsOrder(orderId, userId);
    const result = await this.db.query(
      `UPDATE orders SET status = 'cancelled', cancellation_reason = $1, cancelled_at = NOW()
       WHERE id = $2 AND status IN ('confirmed', 'accepted') RETURNING *`,
      [reason || 'Rejected by seller', orderId],
    );
    if (!result.rows[0]) throw new BadRequestException('Cannot reject this order');

    const order = result.rows[0];

    // Restore stock
    const items = await this.db.query(
      'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
      [orderId],
    );
    for (const item of items.rows) {
      await this.db.query(
        'UPDATE variants SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [item.quantity, item.variant_id],
      );
    }

    await this.notificationsService.sendPush(
      order.buyer_id,
      'Order Rejected',
      `Your order was rejected by the seller. A refund will be initiated.`,
      { order_id: orderId, type: 'order_rejected' },
    );

    return { message: 'Order rejected' };
  }

  async markReady(orderId: string, userId: string) {
    await this.verifyStoreOwnsOrder(orderId, userId);
    const result = await this.db.query(
      `UPDATE orders SET status = 'ready_for_pickup', ready_at = NOW()
       WHERE id = $1 AND status IN ('accepted', 'preparing') RETURNING *`,
      [orderId],
    );
    if (!result.rows[0]) throw new BadRequestException('Order not in accepting/preparing status');

    const order = result.rows[0];

    // Generate delivery OTP
    const otp = await this.deliveryService.generateDeliveryOtp(orderId);

    // Send OTP to buyer
    const buyerResult = await this.db.query(
      'SELECT phone FROM users WHERE id = $1',
      [order.buyer_id],
    );
    if (buyerResult.rows[0]) {
      await this.notificationsService.sendSMS(
        buyerResult.rows[0].phone,
        `Your delivery OTP is ${otp}. Share ONLY with the delivery partner when receiving your order.`,
      );
    }

    // Trigger delivery assignment (async via queue)
    await this.deliveryService.triggerAssignment(orderId);

    await this.notificationsService.sendPush(
      order.buyer_id,
      'Order Ready!',
      'Your order is packed and ready for pickup.',
      { order_id: orderId, type: 'ready_for_pickup' },
    );

    return { message: 'Order marked as ready, delivery partner assignment started' };
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  async getAnalytics(userId: string) {
    const store = await this.getSellerStore(userId);

    const [salesResult, topProducts, recentOrders, dailySales] = await Promise.all([
      this.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'delivered') AS total_orders,
           COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) AS total_revenue,
           COALESCE(AVG(total_amount) FILTER (WHERE status = 'delivered'), 0) AS avg_order_value,
           COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND status = 'delivered') AS orders_7d,
           COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND status = 'delivered'), 0) AS revenue_7d
         FROM orders WHERE store_id = $1`,
        [store.id],
      ),
      this.db.query(
        `SELECT p.id, p.name, p.sold_count, p.price,
                pi.url AS primary_image,
                COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue
         FROM products p
         LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
         LEFT JOIN order_items oi ON oi.product_id = p.id
         LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'delivered'
         WHERE p.store_id = $1 AND p.is_active = true
         GROUP BY p.id, pi.url
         ORDER BY revenue DESC
         LIMIT 5`,
        [store.id],
      ),
      this.db.query(
        `SELECT o.id, o.status, o.total_amount, o.created_at
         FROM orders o WHERE o.store_id = $1
         ORDER BY o.created_at DESC LIMIT 5`,
        [store.id],
      ),
      this.db.query(
        `SELECT DATE_TRUNC('day', created_at) AS date,
                COUNT(*) AS orders, COALESCE(SUM(total_amount), 0) AS revenue
         FROM orders
         WHERE store_id = $1 AND status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY date ORDER BY date ASC`,
        [store.id],
      ),
    ]);

    return {
      sales: salesResult.rows[0],
      top_products: topProducts.rows,
      recent_orders: recentOrders.rows,
      daily_sales: dailySales.rows,
    };
  }

  // ─── Payouts ──────────────────────────────────────────────────────────────

  async getPayouts(userId: string) {
    const store = await this.getSellerStore(userId);
    const result = await this.db.query(
      `SELECT id, amount, type, status, period_start, period_end, created_at, processed_at
       FROM payouts WHERE store_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [store.id],
    );

    const pendingResult = await this.db.query(
      `SELECT COALESCE(SUM(o.subtotal * (1 - c.platform_fee_pct / 100)), 0) AS pending_payout
       FROM orders o
       JOIN cities c ON c.id = o.city_id
       WHERE o.store_id = $1 AND o.status = 'delivered'
         AND NOT EXISTS (
           SELECT 1 FROM payouts p WHERE p.store_id = $1 AND p.status = 'paid'
             AND o.created_at BETWEEN p.period_start AND p.period_end
         )`,
      [store.id],
    );

    return {
      payouts: result.rows,
      pending_payout: parseFloat(pendingResult.rows[0].pending_payout),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async verifyStoreOwnsOrder(orderId: string, userId: string) {
    const result = await this.db.query(
      `SELECT o.id FROM orders o
       JOIN stores s ON s.id = o.store_id
       WHERE o.id = $1 AND s.owner_user_id = $2`,
      [orderId, userId],
    );
    if (!result.rows[0]) throw new ForbiddenException('Not authorized to manage this order');
    return result.rows[0];
  }
}
