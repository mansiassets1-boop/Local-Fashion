import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as admin from 'firebase-admin';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly db: DatabaseService) {}

  @Process('send-push')
  async handleSendPush(job: Job<{ userId: string; title: string; body: string; data?: Record<string, string> }>) {
    const { userId, title, body, data } = job.data;
    try {
      const result = await this.db.query(
        'SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL',
        [userId],
      );
      if (!result.rows[0]) return;

      if (!admin.apps.length) return;

      await admin.messaging().send({
        token: result.rows[0].fcm_token,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
    } catch (err) {
      this.logger.error(`Push send failed for user ${userId}: ${err.message}`);
    }
  }

  @Process('broadcast')
  async handleBroadcast(job: Job<{ userIds: string[]; title: string; body: string; data?: Record<string, string> }>) {
    const { userIds, title, body, data } = job.data;
    if (!admin.apps.length || userIds.length === 0) return;

    try {
      // Fetch FCM tokens in batches
      const batchSize = 500;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(',');
        const result = await this.db.query(
          `SELECT fcm_token FROM users WHERE id IN (${placeholders}) AND fcm_token IS NOT NULL`,
          batch,
        );
        const tokens = result.rows.map((r) => r.fcm_token);
        if (tokens.length === 0) continue;

        // FCM multicast
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title, body },
          data: data || {},
          android: { priority: 'high' },
        });
      }
    } catch (err) {
      this.logger.error(`Broadcast failed: ${err.message}`);
      throw err; // Bull will retry
    }
  }
}
