import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto, ReturnOrderDto, OrdersQueryDto,
} from './dto/orders.dto';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup'],
  ready_for_pickup: ['assigned'],
  assigned: ['picked_up'],
  picked_up: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['return_requested'],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Create Order ─────────────────────────────────────────────────────────

  async createOrder(userId: string, cityId: string, dto: CreateOrderDto) {
    // Get address
    const addressResult = await this.db.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [dto.address_id, userId],
    );
    if (!addressResult.rows[0]) throw new NotFoundException('Address not found');
    const address = addressResult.rows[0];

    // Get cart items
    const cartResult = await this.db.query(
      `SELECT ci.variant_id, ci.quantity,
              v.stock_quantity, v.price_override,
              p.id AS product_id, p.name AS product_name, p.price, p.store_id, p.city_id,
              s.id AS store_id, s.name AS store_name
       FROM cart_items ci
       JOIN variants v ON v.id = ci.variant_id
       JOIN products p ON p.id = v.product_id
       JOIN stores s ON s.id = p.store_id
       WHERE ci.user_id = $1`,
      [userId],
    );

    if (cartResult.rows.length === 0) throw new BadRequestException('Cart is empty');

    // All items must be from same city
    const wrongCity = cartResult.rows.find((i) => i.city_id !== cityId);
    if (wrongCity) throw new BadRequestException('Cart contains items from a different city');

    // All items from same store (current design: single-store per order)
    const storeIds = [...new Set(cartResult.rows.map((i) => i.store_id))];
    if (storeIds.length > 1) throw new BadRequestException('Cart can only have items from one store');

    const storeId = storeIds[0];

    // Re-validate stocks
    for (const item of cartResult.rows) {
      if (item.stock_quantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${item.product_name}`);
      }
    }

    // Calculate totals
    const cityResult = await this.db.query(
      'SELECT platform_fee_pct FROM cities WHERE id = $1',
      [cityId],
    );
    const platformFeePct = parseFloat(cityResult.rows[0]?.platform_fee_pct || '15');

    const subtotal = cartResult.rows.reduce((sum, item) => {
      const price = parseFloat(item.price_override || item.price);
      return sum + price * item.quantity;
    }, 0);

    const deliveryFee = 40; // Fixed delivery fee
    const platformFee = (subtotal * platformFeePct) / 100;
    const totalAmount = subtotal + deliveryFee + platformFee;

    return this.db.transaction(async (client) => {
      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (buyer_id, store_id, city_id, status, subtotal, delivery_fee, platform_fee, total_amount, address_snapshot, razorpay_order_id)
         VALUES ($1, $2, $3, 'pending_payment', $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          userId, storeId, cityId, subtotal, deliveryFee, platformFee, totalAmount,
          JSON.stringify(address), null,
        ],
      );
      const order = orderResult.rows[0];

      // Create order items (snapshot product info)
      for (const item of cartResult.rows) {
        const unitPrice = parseFloat(item.price_override || item.price);
        await client.query(
          `INSERT INTO order_items (order_id, variant_id, product_id, quantity, price_at_purchase, product_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id, item.variant_id, item.product_id, item.quantity, unitPrice,
            JSON.stringify({ name: item.product_name, price: unitPrice }),
          ],
        );
      }

      // Create Razorpay order
      const rzpOrder = await this.paymentsService.createOrder(
        totalAmount, 'INR', order.id,
        { order_id: order.id, buyer_id: userId },
      );

      // Update order with Razorpay order ID
      await client.query(
        'UPDATE orders SET razorpay_order_id = $1 WHERE id = $2',
        [rzpOrder.id, order.id],
      );

      // Upgrade soft locks to hard locks
      for (const item of cartResult.rows) {
        await client.query(
          `UPDATE cart_locks SET lock_type = 'hard', expires_at = NOW() + INTERVAL '30 minutes'
           WHERE variant_id = $1 AND user_id = $2 AND lock_type = 'soft'`,
          [item.variant_id, userId],
        );
      }

      return {
        order_id: order.id,
        razorpay_order_id: rzpOrder.id,
        amount: totalAmount,
        currency: 'INR',
        subtotal,
        delivery_fee: deliveryFee,
        platform_fee: platformFee,
      };
    });
  }

  // ─── Razorpay Webhook ─────────────────────────────────────────────────────

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.paymentsService.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(payload.toString());
    this.logger.log(`Razorpay webhook: ${event.event}`);

    switch (event.event) {
      case 'payment.captured':
        await this.onPaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await this.onPaymentFailed(event.payload.payment.entity);
        break;
      default:
        this.logger.debug(`Unhandled webhook event: ${event.event}`);
    }

    return { status: 'ok' };
  }

  private async onPaymentCaptured(payment: any) {
    const orderResult = await this.db.query(
      "SELECT * FROM orders WHERE razorpay_order_id = $1 AND status = 'pending_payment'",
      [payment.order_id],
    );
    if (!orderResult.rows[0]) return;
    const order = orderResult.rows[0];

    await this.db.transaction(async (client) => {
      // Update order status
      await client.query(
        `UPDATE orders SET status = 'confirmed', razorpay_payment_id = $1, accepted_at = NOW()
         WHERE id = $2`,
        [payment.id, order.id],
      );

      // Deduct stock for each order item
      const itemsResult = await client.query(
        'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
        [order.id],
      );
      for (const item of itemsResult.rows) {
        await client.query(
          'SELECT id FROM variants WHERE id = $1 FOR UPDATE',
          [item.variant_id],
        );
        await client.query(
          'UPDATE variants SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.variant_id],
        );
        // Increment sold count on product
        await client.query(
          `UPDATE products SET sold_count = sold_count + $1
           WHERE id = (SELECT product_id FROM variants WHERE id = $2)`,
          [item.quantity, item.variant_id],
        );
      }

      // Release hard locks
      await client.query(
        "DELETE FROM cart_locks WHERE user_id = $1 AND lock_type = 'hard'",
        [order.buyer_id],
      );

      // Clear cart
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [order.buyer_id]);
    });

    // Notify seller
    const storeResult = await this.db.query(
      'SELECT owner_user_id FROM stores WHERE id = $1',
      [order.store_id],
    );
    if (storeResult.rows[0]) {
      await this.notificationsService.sendPush(
        storeResult.rows[0].owner_user_id,
        'New Order!',
        `Order #${order.id.slice(-8)} received. Accept within 15 minutes.`,
        { order_id: order.id, type: 'new_order' },
      );
    }

    // Notify buyer
    await this.notificationsService.sendPush(
      order.buyer_id,
      'Order Confirmed!',
      `Your order has been placed successfully.`,
      { order_id: order.id, type: 'order_confirmed' },
    );
  }

  private async onPaymentFailed(payment: any) {
    const orderResult = await this.db.query(
      "SELECT id, buyer_id FROM orders WHERE razorpay_order_id = $1",
      [payment.order_id],
    );
    if (!orderResult.rows[0]) return;

    const order = orderResult.rows[0];
    await this.db.query(
      "UPDATE orders SET status = 'cancelled', cancellation_reason = 'payment_failed', cancelled_at = NOW() WHERE id = $1",
      [order.id],
    );

    // Release hard locks
    await this.db.query(
      "DELETE FROM cart_locks WHERE user_id = $1 AND lock_type = 'hard'",
      [order.buyer_id],
    );
  }

  // ─── List Orders ──────────────────────────────────────────────────────────

  async getUserOrders(userId: string, query: OrdersQueryDto) {
    const page = Math.max(1, +(query.page || 1));
    const limit = Math.min(50, +(query.limit || 20));
    const offset = (page - 1) * limit;
    const params: any[] = [userId];
    const conditions = ['o.buyer_id = $1'];
    let idx = 2;

    if (query.status) {
      conditions.push(`o.status = $${idx++}`);
      params.push(query.status);
    }

    const result = await this.db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, o.delivered_at,
              s.name AS store_name, s.logo_url AS store_logo,
              COUNT(oi.id) AS item_count
       FROM orders o
       JOIN stores s ON s.id = o.store_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY o.id, s.name, s.logo_url
       ORDER BY o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset],
    );

    return { items: result.rows, page, limit };
  }

  async getOrderById(orderId: string, userId: string) {
    const result = await this.db.query(
      `SELECT o.*,
              s.name AS store_name, s.address AS store_address, s.phone AS store_phone,
              s.logo_url AS store_logo,
              dp_user.name AS delivery_partner_name
       FROM orders o
       JOIN stores s ON s.id = o.store_id
       LEFT JOIN delivery_assignments da ON da.order_id = o.id AND da.status = 'accepted'
       LEFT JOIN delivery_partners dp ON dp.id = da.partner_id
       LEFT JOIN users dp_user ON dp_user.id = dp.user_id
       WHERE o.id = $1`,
      [orderId],
    );
    if (!result.rows[0]) throw new NotFoundException('Order not found');

    const order = result.rows[0];
    // Allow buyer, seller, admin, delivery partner
    // (full ACL is role-based in controller)

    // Get order items
    const itemsResult = await this.db.query(
      `SELECT oi.*, p.name AS product_name, pi.url AS product_image,
              v.size, v.color
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
       JOIN variants v ON v.id = oi.variant_id
       WHERE oi.order_id = $1`,
      [orderId],
    );

    return { ...order, items: itemsResult.rows };
  }

  async getOrderLocation(orderId: string) {
    const result = await this.db.query(
      `SELECT dl.lat, dl.lng, dl.recorded_at
       FROM delivery_locations dl
       JOIN delivery_assignments da ON da.order_id = $1 AND da.status = 'accepted'
       JOIN delivery_partners dp ON dp.id = da.partner_id AND dp.id = dl.partner_id
       WHERE dl.order_id = $1
       ORDER BY dl.recorded_at DESC
       LIMIT 1`,
      [orderId],
    );
    if (!result.rows[0]) throw new NotFoundException('Location not available');
    return result.rows[0];
  }

  async updateOrderStatus(orderId: string, userId: string, userRole: string, dto: UpdateOrderStatusDto) {
    const order = await this.getOrderRecord(orderId);

    // Role-based status validation
    const allowed = VALID_STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    const updates: Record<string, any> = { status: dto.status };
    if (dto.status === 'ready_for_pickup') updates.ready_at = new Date();
    if (dto.status === 'picked_up') updates.picked_up_at = new Date();
    if (dto.status === 'delivered') updates.delivered_at = new Date();
    if (dto.status === 'cancelled') {
      updates.cancelled_at = new Date();
      if (dto.reason) updates.cancellation_reason = dto.reason;
    }

    const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [orderId, ...Object.values(updates)];

    const result = await this.db.query(
      `UPDATE orders SET ${setClause} WHERE id = $1 RETURNING *`,
      values,
    );

    // Notify buyer on key status changes
    const notifMessages: Record<string, string> = {
      accepted: 'Your order has been accepted by the store.',
      preparing: 'Your order is being prepared.',
      ready_for_pickup: 'Your order is ready! Delivery partner will be assigned soon.',
      picked_up: 'Your order has been picked up by delivery partner.',
      out_for_delivery: 'Your order is out for delivery!',
      delivered: 'Your order has been delivered. Enjoy!',
    };

    if (notifMessages[dto.status]) {
      await this.notificationsService.sendPush(
        order.buyer_id,
        'Order Update',
        notifMessages[dto.status],
        { order_id: orderId, status: dto.status },
      );
    }

    return result.rows[0];
  }

  async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto) {
    const order = await this.getOrderRecord(orderId);

    if (order.buyer_id !== userId) throw new ForbiddenException('Not authorized');

    const cancellableStatuses = ['confirmed', 'accepted'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order in status: ${order.status}`);
    }

    await this.db.query(
      `UPDATE orders SET status = 'cancelled', cancellation_reason = $1, cancelled_at = NOW() WHERE id = $2`,
      [dto.reason || 'Cancelled by buyer', orderId],
    );

    // Restore stock (if payment was captured)
    if (order.razorpay_payment_id) {
      await this.restoreStock(orderId);
      // Trigger refund
      try {
        await this.paymentsService.createRefund(order.razorpay_payment_id);
        await this.db.query(
          "UPDATE orders SET status = 'refunded' WHERE id = $1",
          [orderId],
        );
      } catch (err) {
        this.logger.error(`Refund failed for order ${orderId}:`, err.message);
      }
    }

    return { message: 'Order cancelled successfully' };
  }

  async createReturnRequest(orderId: string, userId: string, dto: ReturnOrderDto) {
    const order = await this.getOrderRecord(orderId);
    if (order.buyer_id !== userId) throw new ForbiddenException('Not authorized');
    if (order.status !== 'delivered') throw new BadRequestException('Order must be delivered to request return');

    const result = await this.db.query(
      `INSERT INTO return_requests (order_id, buyer_id, reason, description, photo_urls)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderId, userId, dto.reason, dto.description || null, dto.photo_urls || null],
    );

    await this.db.query(
      "UPDATE orders SET status = 'return_requested' WHERE id = $1",
      [orderId],
    );

    return result.rows[0];
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  async getOrderRecord(orderId: string) {
    const result = await this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!result.rows[0]) throw new NotFoundException('Order not found');
    return result.rows[0];
  }

  private async restoreStock(orderId: string) {
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
  }
}
