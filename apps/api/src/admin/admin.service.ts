import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ApproveSellerDto, SuspendSellerDto, AdminRefundDto, BroadcastDto, AdminOrdersQueryDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Metrics ──────────────────────────────────────────────────────────────

  async getMetrics() {
    const [
      ordersToday, revenue, activeSellers, deliveryPartners, pendingReturns, slaViolations,
    ] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue
         FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelled'`,
      ),
      this.db.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM orders WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'`,
      ),
      this.db.query("SELECT COUNT(*) FROM stores WHERE status = 'active'"),
      this.db.query("SELECT COUNT(*) FROM delivery_partners WHERE status != 'offline'"),
      this.db.query("SELECT COUNT(*) FROM return_requests WHERE status = 'pending'"),
      this.db.query(
        "SELECT COUNT(*) FROM sla_violations WHERE created_at >= NOW() - INTERVAL '7 days'",
      ),
    ]);

    return {
      orders_today: parseInt(ordersToday.rows[0].count),
      revenue_today: parseFloat(ordersToday.rows[0].revenue),
      revenue_30d: parseFloat(revenue.rows[0].total),
      active_sellers: parseInt(activeSellers.rows[0].count),
      active_delivery_partners: parseInt(deliveryPartners.rows[0].count),
      pending_returns: parseInt(pendingReturns.rows[0].count),
      sla_violations_7d: parseInt(slaViolations.rows[0].count),
    };
  }

  // ─── Sellers ──────────────────────────────────────────────────────────────

  async getSellers(query: any) {
    const page = Math.max(1, +(query.page || 1));
    const limit = Math.min(50, +(query.limit || 20));
    const offset = (page - 1) * limit;
    const params: any[] = [];
    const conditions: string[] = [];
    let idx = 1;

    if (query.status) {
      conditions.push(`s.status = $${idx++}`);
      params.push(query.status);
    }
    if (query.city_id) {
      conditions.push(`s.city_id = $${idx++}`);
      params.push(query.city_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.db.query(
      `SELECT s.id, s.name, s.status, s.created_at, s.city_id,
              u.phone, u.name AS owner_name,
              COUNT(DISTINCT p.id) AS product_count,
              COUNT(DISTINCT o.id) AS order_count,
              COALESCE(SUM(o.total_amount), 0) AS total_revenue
       FROM stores s
       JOIN users u ON u.id = s.owner_user_id
       LEFT JOIN products p ON p.store_id = s.id
       LEFT JOIN orders o ON o.store_id = s.id AND o.status = 'delivered'
       ${where}
       GROUP BY s.id, u.phone, u.name
       ORDER BY s.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset],
    );

    const count = await this.db.query(
      `SELECT COUNT(*) FROM stores s ${where}`,
      params,
    );

    return { items: result.rows, total: parseInt(count.rows[0].count), page, limit };
  }

  async approveSeller(storeId: string, dto: ApproveSellerDto) {
    const storeResult = await this.db.query(
      "SELECT s.*, u.phone, u.name FROM stores s JOIN users u ON u.id = s.owner_user_id WHERE s.id = $1",
      [storeId],
    );
    if (!storeResult.rows[0]) throw new NotFoundException('Store not found');
    const store = storeResult.rows[0];

    await this.db.query(
      "UPDATE stores SET status = 'active', rejection_reason = NULL WHERE id = $1",
      [storeId],
    );

    // Notify seller
    await this.notificationsService.sendPush(
      store.owner_user_id,
      'Store Approved!',
      'Congratulations! Your store has been approved. You can now list products.',
      { type: 'store_approved', store_id: storeId },
    );

    await this.notificationsService.sendSMS(
      store.phone,
      `Congratulations ${store.name}! Your LocalFashion store has been approved. Start listing products now.`,
    );

    return { message: 'Seller approved' };
  }

  async suspendSeller(storeId: string, dto: SuspendSellerDto) {
    const storeResult = await this.db.query(
      "SELECT s.*, u.phone FROM stores s JOIN users u ON u.id = s.owner_user_id WHERE s.id = $1",
      [storeId],
    );
    if (!storeResult.rows[0]) throw new NotFoundException('Store not found');
    const store = storeResult.rows[0];

    await this.db.query(
      "UPDATE stores SET status = 'suspended', rejection_reason = $1 WHERE id = $2",
      [dto.reason, storeId],
    );

    await this.notificationsService.sendPush(
      store.owner_user_id,
      'Store Suspended',
      `Your store has been suspended: ${dto.reason}`,
      { type: 'store_suspended', store_id: storeId },
    );

    return { message: 'Seller suspended' };
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async getAllOrders(query: AdminOrdersQueryDto) {
    const page = Math.max(1, +(query.page || 1));
    const limit = Math.min(100, +(query.limit || 20));
    const offset = (page - 1) * limit;
    const params: any[] = [];
    const conditions: string[] = [];
    let idx = 1;

    if (query.status) {
      conditions.push(`o.status = $${idx++}`);
      params.push(query.status);
    }
    if (query.city_id) {
      conditions.push(`o.city_id = $${idx++}`);
      params.push(query.city_id);
    }
    if (query.store_id) {
      conditions.push(`o.store_id = $${idx++}`);
      params.push(query.store_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, o.delivered_at,
              u.name AS buyer_name, u.phone AS buyer_phone,
              s.name AS store_name
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
       JOIN stores s ON s.id = o.store_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset],
    );

    return { items: result.rows, page, limit };
  }

  async refundOrder(orderId: string, dto: AdminRefundDto) {
    const orderResult = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId],
    );
    if (!orderResult.rows[0]) throw new NotFoundException('Order not found');
    const order = orderResult.rows[0];
    if (!order.razorpay_payment_id) throw new NotFoundException('No payment found for this order');

    const refund = await this.paymentsService.createRefund(
      order.razorpay_payment_id, dto.amount,
      dto.reason ? { reason: dto.reason } : undefined,
    );

    await this.db.query(
      "UPDATE orders SET status = 'refunded' WHERE id = $1",
      [orderId],
    );

    await this.notificationsService.sendPush(
      order.buyer_id,
      'Refund Initiated',
      `Your refund has been processed. Amount: ₹${dto.amount || order.total_amount}`,
      { order_id: orderId, type: 'refund' },
    );

    return { message: 'Refund initiated', refund_id: refund.id };
  }

  // ─── Delivery Partners ────────────────────────────────────────────────────

  async getDeliveryPartners(query: any) {
    const page = Math.max(1, +(query.page || 1));
    const limit = +(query.limit || 20);
    const offset = (page - 1) * limit;

    const result = await this.db.query(
      `SELECT dp.id, dp.status, dp.total_deliveries, dp.avg_rating, dp.vehicle_type, dp.created_at,
              u.name, u.phone, c.name AS city_name
       FROM delivery_partners dp
       JOIN users u ON u.id = dp.user_id
       JOIN cities c ON c.id = dp.city_id
       WHERE ($1::text IS NULL OR dp.city_id = $1)
       ORDER BY dp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [query.city_id || null, limit, offset],
    );
    return { items: result.rows, page, limit };
  }

  // ─── Complaints / Returns ─────────────────────────────────────────────────

  async getComplaints(query: any) {
    const page = Math.max(1, +(query.page || 1));
    const limit = +(query.limit || 20);
    const offset = (page - 1) * limit;

    const result = await this.db.query(
      `SELECT rr.*, u.name AS buyer_name, u.phone AS buyer_phone,
              o.total_amount, o.store_id, s.name AS store_name
       FROM return_requests rr
       JOIN users u ON u.id = rr.buyer_id
       JOIN orders o ON o.id = rr.order_id
       JOIN stores s ON s.id = o.store_id
       WHERE ($1::text IS NULL OR rr.status = $1)
       ORDER BY rr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [query.status || null, limit, offset],
    );
    return { items: result.rows, page, limit };
  }

  // ─── Broadcast ───────────────────────────────────────────────────────────

  async broadcastNotification(dto: BroadcastDto) {
    if (dto.role) {
      return this.notificationsService.sendToAll(dto.city_id, dto.role, dto.title, dto.body);
    }
    return this.notificationsService.broadcastToCity(dto.city_id, dto.title, dto.body);
  }
}
