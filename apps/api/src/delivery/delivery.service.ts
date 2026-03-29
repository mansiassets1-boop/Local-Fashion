import {
  Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  UpdateLocationDto, ToggleAvailabilityDto, VerifyDeliveryOtpDto,
} from './dto/delivery.dto';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue('delivery-assignment') private readonly assignmentQueue: Queue,
  ) {}

  // ─── Availability ─────────────────────────────────────────────────────────

  async toggleAvailability(userId: string, dto: ToggleAvailabilityDto) {
    const dp = await this.getDeliveryPartner(userId);
    const newStatus = dto.online ? 'online' : 'offline';

    if (dp.current_order_id && dto.online === false) {
      throw new BadRequestException('Cannot go offline while on an active delivery');
    }

    await this.db.query(
      'UPDATE delivery_partners SET status = $1 WHERE id = $2',
      [newStatus, dp.id],
    );
    return { status: newStatus };
  }

  // ─── Location ─────────────────────────────────────────────────────────────

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const dp = await this.getDeliveryPartner(userId);

    // Update current location
    await this.db.query(
      `UPDATE delivery_partners SET
         current_lat = $1, current_lng = $2,
         current_location = ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
       WHERE id = $5`,
      [dto.lat, dto.lng, dto.lng, dto.lat, dp.id],
    );

    // Log to delivery_locations
    await this.db.query(
      `INSERT INTO delivery_locations (partner_id, order_id, lat, lng)
       VALUES ($1, $2, $3, $4)`,
      [dp.id, dto.order_id || dp.current_order_id || null, dto.lat, dto.lng],
    );

    return { message: 'Location updated' };
  }

  // ─── Assignment ───────────────────────────────────────────────────────────

  async triggerAssignment(orderId: string) {
    await this.assignmentQueue.add('assign-delivery', { orderId }, { attempts: 1 });
  }

  async assignDelivery(orderId: string) {
    const orderResult = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId],
    );
    if (!orderResult.rows[0]) throw new NotFoundException('Order not found');
    const order = orderResult.rows[0];

    const storeResult = await this.db.query(
      'SELECT id, lat, lng, city_id FROM stores WHERE id = $1',
      [order.store_id],
    );
    if (!storeResult.rows[0]) return;
    const store = storeResult.rows[0];

    // Find nearest available delivery partners
    const nearbyResult = await this.db.query(
      `SELECT dp.id, dp.user_id,
              ST_Distance(
                ST_MakePoint(dp.current_lng, dp.current_lat)::geography,
                ST_MakePoint($1, $2)::geography
              ) AS distance_meters
       FROM delivery_partners dp
       WHERE dp.city_id = $3
         AND dp.status = 'online'
         AND dp.current_order_id IS NULL
       ORDER BY distance_meters ASC
       LIMIT 5`,
      [store.lng, store.lat, store.city_id],
    );

    if (nearbyResult.rows.length === 0) {
      this.logger.warn(`No available delivery partners for order ${orderId}`);
      // Alert admin
      await this.notifyAdminNoPartner(orderId);
      return;
    }

    // Try top 5 in sequence
    for (const partner of nearbyResult.rows) {
      const assigned = await this.sendAssignmentRequest(orderId, partner.id, partner.user_id);
      if (assigned) return;
    }

    // All 5 rejected/timed out
    this.logger.error(`All delivery partners rejected order ${orderId}`);
    await this.notifyAdminNoPartner(orderId);
  }

  private async sendAssignmentRequest(orderId: string, partnerId: string, partnerUserId: string): Promise<boolean> {
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 second timeout

    // Create assignment record
    const assignResult = await this.db.query(
      `INSERT INTO delivery_assignments (order_id, partner_id, status, expires_at)
       VALUES ($1, $2, 'pending', $3) RETURNING id`,
      [orderId, partnerId, expiresAt],
    );
    const assignmentId = assignResult.rows[0].id;

    // Send push notification to partner
    await this.notificationsService.sendPush(
      partnerUserId,
      'New Delivery Request!',
      'A delivery request is waiting for you. Accept within 60 seconds.',
      { assignment_id: assignmentId, order_id: orderId, type: 'delivery_request' },
    );

    // Queue timeout check after 60s
    await this.assignmentQueue.add(
      'check-assignment-timeout',
      { assignmentId, orderId, partnerId },
      { delay: 61000 },
    );

    // Wait for response via polling (non-blocking in production; here we return true optimistically)
    // In production, the partner's response triggers the next step via PATCH endpoint
    return false; // Signal to continue trying next partner (assignment proceeds asynchronously)
  }

  async acceptAssignment(assignmentId: string, userId: string) {
    const dp = await this.getDeliveryPartner(userId);

    const assignResult = await this.db.query(
      `SELECT da.*, o.buyer_id, o.city_id
       FROM delivery_assignments da
       JOIN orders o ON o.id = da.order_id
       WHERE da.id = $1 AND da.partner_id = $2 AND da.status = 'pending' AND da.expires_at > NOW()`,
      [assignmentId, dp.id],
    );
    if (!assignResult.rows[0]) throw new BadRequestException('Assignment not found or expired');
    const assignment = assignResult.rows[0];

    return this.db.transaction(async (client) => {
      // Update assignment
      await client.query(
        `UPDATE delivery_assignments SET status = 'accepted', responded_at = NOW() WHERE id = $1`,
        [assignmentId],
      );

      // Mark other pending assignments for same order as expired
      await client.query(
        `UPDATE delivery_assignments SET status = 'expired'
         WHERE order_id = $1 AND id != $2 AND status = 'pending'`,
        [assignment.order_id, assignmentId],
      );

      // Assign order to partner
      await client.query(
        `UPDATE orders SET status = 'assigned' WHERE id = $1`,
        [assignment.order_id],
      );

      // Update delivery partner
      await client.query(
        `UPDATE delivery_partners SET status = 'on_delivery', current_order_id = $1 WHERE id = $2`,
        [assignment.order_id, dp.id],
      );

      return { message: 'Assignment accepted', order_id: assignment.order_id };
    });
  }

  async rejectAssignment(assignmentId: string, userId: string) {
    const dp = await this.getDeliveryPartner(userId);

    const result = await this.db.query(
      `UPDATE delivery_assignments
       SET status = 'rejected', responded_at = NOW()
       WHERE id = $1 AND partner_id = $2 AND status = 'pending'
       RETURNING order_id`,
      [assignmentId, dp.id],
    );
    if (!result.rows[0]) throw new NotFoundException('Assignment not found');

    // Try next partner
    await this.assignmentQueue.add('assign-next', { orderId: result.rows[0].order_id, skippedPartnerId: dp.id });

    return { message: 'Assignment rejected' };
  }

  // ─── OTP Delivery ─────────────────────────────────────────────────────────

  async verifyDeliveryOtp(userId: string, dto: VerifyDeliveryOtpDto) {
    const dp = await this.getDeliveryPartner(userId);

    const orderResult = await this.db.query(
      `SELECT id, otp, otp_attempts, otp_expires_at, buyer_id
       FROM orders
       WHERE id = $1 AND status = 'out_for_delivery'`,
      [dto.order_id],
    );
    if (!orderResult.rows[0]) throw new NotFoundException('Order not found or not out for delivery');
    const order = orderResult.rows[0];

    if (new Date(order.otp_expires_at) < new Date()) {
      throw new BadRequestException('Delivery OTP has expired');
    }

    if (order.otp_attempts >= 3) {
      // Escalate to admin
      await this.escalateOtpFailure(dto.order_id, order.buyer_id);
      throw new BadRequestException('Maximum OTP attempts exceeded. Admin has been notified.');
    }

    if (order.otp !== dto.otp) {
      await this.db.query(
        'UPDATE orders SET otp_attempts = otp_attempts + 1 WHERE id = $1',
        [dto.order_id],
      );
      throw new BadRequestException('Invalid OTP');
    }

    // Mark as delivered
    await this.db.transaction(async (client) => {
      await client.query(
        "UPDATE orders SET status = 'delivered', delivered_at = NOW() WHERE id = $1",
        [dto.order_id],
      );
      await client.query(
        "UPDATE delivery_partners SET status = 'online', current_order_id = NULL WHERE id = $1",
        [dp.id],
      );
      await client.query(
        "UPDATE delivery_assignments SET earnings = 50.00 WHERE order_id = $1 AND status = 'accepted'",
        [dto.order_id],
      );
      // Increment total deliveries
      await client.query(
        'UPDATE delivery_partners SET total_deliveries = total_deliveries + 1 WHERE id = $1',
        [dp.id],
      );
    });

    // Notify buyer
    await this.notificationsService.sendPush(
      order.buyer_id,
      'Order Delivered!',
      'Your order has been delivered. Enjoy your purchase!',
      { order_id: dto.order_id, type: 'delivered' },
    );

    return { message: 'Delivery confirmed' };
  }

  // ─── Earnings ─────────────────────────────────────────────────────────────

  async getEarnings(userId: string, period?: string) {
    const dp = await this.getDeliveryPartner(userId);

    let interval = "30 days";
    if (period === 'today') interval = "1 day";
    else if (period === 'week') interval = "7 days";

    const result = await this.db.query(
      `SELECT
         COUNT(da.id) AS total_deliveries,
         COALESCE(SUM(da.earnings), 0) AS total_earned,
         COALESCE(AVG(da.earnings), 0) AS avg_per_delivery,
         DATE_TRUNC('day', o.delivered_at) AS date,
         SUM(da.earnings) AS daily_earnings
       FROM delivery_assignments da
       JOIN orders o ON o.id = da.order_id
       WHERE da.partner_id = $1
         AND da.status = 'accepted'
         AND o.status = 'delivered'
         AND o.delivered_at >= NOW() - $2::INTERVAL
       GROUP BY DATE_TRUNC('day', o.delivered_at)
       ORDER BY date DESC`,
      [dp.id, interval],
    );

    const totals = await this.db.query(
      `SELECT
         COUNT(da.id) AS total_deliveries,
         COALESCE(SUM(da.earnings), 0) AS total_earned
       FROM delivery_assignments da
       JOIN orders o ON o.id = da.order_id
       WHERE da.partner_id = $1
         AND da.status = 'accepted'
         AND o.status = 'delivered'
         AND o.delivered_at >= NOW() - $2::INTERVAL`,
      [dp.id, interval],
    );

    return {
      summary: totals.rows[0],
      daily: result.rows,
      period: period || 'month',
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  async getDeliveryPartner(userId: string) {
    const result = await this.db.query(
      'SELECT * FROM delivery_partners WHERE user_id = $1',
      [userId],
    );
    if (!result.rows[0]) throw new NotFoundException('Delivery partner profile not found');
    return result.rows[0];
  }

  private async escalateOtpFailure(orderId: string, buyerId: string) {
    this.logger.warn(`OTP failure escalation for order ${orderId}`);
    await this.notificationsService.sendPush(
      buyerId,
      'Delivery Issue',
      'There was an issue with OTP verification for your delivery. Our support team has been notified.',
      { order_id: orderId, type: 'otp_escalation' },
    );
  }

  private async notifyAdminNoPartner(orderId: string) {
    // Find admin users and alert them
    const admins = await this.db.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 5",
    );
    for (const admin of admins.rows) {
      await this.notificationsService.sendPush(
        admin.id,
        'No Delivery Partner Available',
        `Order ${orderId.slice(-8)} has no available delivery partner.`,
        { order_id: orderId, type: 'no_partner_alert' },
      );
    }
  }

  async generateDeliveryOtp(orderId: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.db.query(
      'UPDATE orders SET otp = $1, otp_expires_at = $2, otp_attempts = 0 WHERE id = $3',
      [otp, expiresAt, orderId],
    );

    return otp;
  }
}
