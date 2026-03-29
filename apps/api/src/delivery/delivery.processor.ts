import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DeliveryService } from './delivery.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('delivery-assignment')
export class DeliveryProcessor {
  private readonly logger = new Logger(DeliveryProcessor.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly deliveryService: DeliveryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('assign-delivery')
  async handleAssignDelivery(job: Job<{ orderId: string }>) {
    const { orderId } = job.data;
    await this.deliveryService.assignDelivery(orderId);
  }

  @Process('check-assignment-timeout')
  async handleAssignmentTimeout(job: Job<{ assignmentId: string; orderId: string; partnerId: string }>) {
    const { assignmentId, orderId, partnerId } = job.data;

    // Check if assignment is still pending
    const result = await this.db.query(
      "SELECT id FROM delivery_assignments WHERE id = $1 AND status = 'pending'",
      [assignmentId],
    );

    if (result.rows[0]) {
      // Mark as expired
      await this.db.query(
        "UPDATE delivery_assignments SET status = 'expired' WHERE id = $1",
        [assignmentId],
      );
      this.logger.log(`Assignment ${assignmentId} timed out, trying next partner`);

      // Try next partner
      await this.assignNextPartner(orderId, partnerId);
    }
  }

  @Process('assign-next')
  async handleAssignNext(job: Job<{ orderId: string; skippedPartnerId: string }>) {
    const { orderId, skippedPartnerId } = job.data;
    await this.assignNextPartner(orderId, skippedPartnerId);
  }

  private async assignNextPartner(orderId: string, skippedPartnerId: string) {
    // Check if already assigned
    const orderResult = await this.db.query(
      "SELECT city_id, store_id, status FROM orders WHERE id = $1",
      [orderId],
    );
    if (!orderResult.rows[0] || orderResult.rows[0].status !== 'ready_for_pickup') return;

    const storeResult = await this.db.query(
      'SELECT lat, lng FROM stores WHERE id = $1',
      [orderResult.rows[0].store_id],
    );
    if (!storeResult.rows[0]) return;
    const store = storeResult.rows[0];

    // Get already-tried partners for this order
    const triedResult = await this.db.query(
      "SELECT partner_id FROM delivery_assignments WHERE order_id = $1 AND status IN ('rejected', 'expired')",
      [orderId],
    );
    const triedIds = triedResult.rows.map((r) => r.partner_id);

    if (triedIds.length >= 5) {
      this.logger.error(`All 5 partners tried for order ${orderId}, alerting admin`);
      await this.deliveryService['notifyAdminNoPartner'](orderId);
      return;
    }

    // Find next nearest partner not in tried list
    const placeholders = triedIds.map((_, i) => `$${i + 4}`).join(',');
    const notInClause = triedIds.length > 0 ? `AND dp.id NOT IN (${placeholders})` : '';

    const nearbyResult = await this.db.query(
      `SELECT dp.id, dp.user_id
       FROM delivery_partners dp
       WHERE dp.city_id = $1
         AND dp.status = 'online'
         AND dp.current_order_id IS NULL
         ${notInClause}
       ORDER BY ST_Distance(
         ST_MakePoint(dp.current_lng, dp.current_lat)::geography,
         ST_MakePoint($2, $3)::geography
       ) ASC
       LIMIT 1`,
      [orderResult.rows[0].city_id, store.lng, store.lat, ...triedIds],
    );

    if (nearbyResult.rows[0]) {
      const partner = nearbyResult.rows[0];
      const expiresAt = new Date(Date.now() + 60 * 1000);
      const assignResult = await this.db.query(
        `INSERT INTO delivery_assignments (order_id, partner_id, status, expires_at)
         VALUES ($1, $2, 'pending', $3) RETURNING id`,
        [orderId, partner.id, expiresAt],
      );

      await this.notificationsService.sendPush(
        partner.user_id,
        'New Delivery Request!',
        'A delivery request is waiting for you. Accept within 60 seconds.',
        { assignment_id: assignResult.rows[0].id, order_id: orderId, type: 'delivery_request' },
      );
    } else {
      await this.deliveryService['notifyAdminNoPartner'](orderId);
    }
  }
}
