import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('sla-enforcement')
export class SlaEnforcementProcessor {
  private readonly logger = new Logger(SlaEnforcementProcessor.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('check-sla')
  async handleSlaCheck(job: Job) {
    this.logger.log('Running SLA enforcement check...');

    // Find orders in 'confirmed' status older than 15 minutes
    const overdueResult = await this.db.query(
      `SELECT o.id, o.store_id, o.buyer_id, o.razorpay_payment_id,
              o.created_at, s.sla_accept_mins
       FROM orders o
       JOIN cities c ON c.id = o.city_id
       JOIN stores s ON s.id = o.store_id
       WHERE o.status = 'confirmed'
         AND o.created_at < NOW() - (c.sla_accept_mins || ' minutes')::INTERVAL`,
    );

    for (const order of overdueResult.rows) {
      this.logger.warn(`SLA violation: order ${order.id} not accepted in time`);

      await this.db.transaction(async (client) => {
        // Auto-cancel order
        await client.query(
          `UPDATE orders SET status = 'cancelled', cancellation_reason = 'SLA violation: seller did not accept in time', cancelled_at = NOW() WHERE id = $1`,
          [order.id],
        );

        // Log SLA violation
        await client.query(
          `INSERT INTO sla_violations (store_id, order_id, type) VALUES ($1, $2, 'accept_timeout')`,
          [order.store_id, order.id],
        );

        // Restore stock
        const items = await client.query(
          'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
          [order.id],
        );
        for (const item of items.rows) {
          await client.query(
            'UPDATE variants SET stock_quantity = stock_quantity + $1 WHERE id = $2',
            [item.quantity, item.variant_id],
          );
        }
      });

      // Trigger refund
      if (order.razorpay_payment_id) {
        try {
          await this.paymentsService.createRefund(order.razorpay_payment_id);
          await this.db.query(
            "UPDATE orders SET status = 'refunded' WHERE id = $1",
            [order.id],
          );
        } catch (err) {
          this.logger.error(`Auto-refund failed for order ${order.id}: ${err.message}`);
        }
      }

      // Check violation count for this store
      const violationsResult = await this.db.query(
        'SELECT COUNT(*) FROM sla_violations WHERE store_id = $1',
        [order.store_id],
      );
      const count = parseInt(violationsResult.rows[0].count);

      // Get store owner
      const storeResult = await this.db.query(
        'SELECT owner_user_id FROM stores WHERE id = $1',
        [order.store_id],
      );

      if (storeResult.rows[0]) {
        const ownerId = storeResult.rows[0].owner_user_id;

        if (count >= 5) {
          // Suspend store
          await this.db.query(
            "UPDATE stores SET status = 'suspended' WHERE id = $1",
            [order.store_id],
          );
          await this.notificationsService.sendPush(
            ownerId,
            'Store Suspended',
            'Your store has been suspended due to repeated SLA violations. Contact support.',
            { type: 'store_suspended', store_id: order.store_id },
          );
        } else if (count >= 3) {
          await this.notificationsService.sendPush(
            ownerId,
            'SLA Warning',
            `Your store has ${count} SLA violations. You may be suspended after 5 violations.`,
            { type: 'sla_warning', count: String(count) },
          );
        }
      }

      // Notify buyer
      await this.notificationsService.sendPush(
        order.buyer_id,
        'Order Cancelled',
        'Your order was cancelled as the seller did not respond in time. A full refund has been initiated.',
        { order_id: order.id, type: 'order_cancelled_sla' },
      );
    }

    this.logger.log(`SLA check complete. Processed ${overdueResult.rows.length} violations.`);
  }
}
