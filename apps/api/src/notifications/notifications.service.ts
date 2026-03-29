import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as admin from 'firebase-admin';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    @InjectQueue('notifications') private readonly notifQueue: Queue,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    const serviceAccountStr = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountStr) {
      this.logger.warn('Firebase Admin not configured — push notifications disabled');
      return;
    }
    try {
      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(serviceAccountStr);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      this.firebaseInitialized = true;
    } catch (err) {
      this.logger.error('Firebase init failed:', err.message);
    }
  }

  // ─── Inbox ────────────────────────────────────────────────────────────────

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await this.db.query(
      `SELECT id, type, title, body, data, is_read, sent_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    const countResult = await this.db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId],
    );
    return {
      items: result.rows,
      unread_count: parseInt(countResult.rows[0].count),
    };
  }

  async markRead(notifId: string, userId: string) {
    const result = await this.db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
      [notifId, userId],
    );
    if (!result.rows[0]) throw new NotFoundException('Notification not found');
    return { message: 'Marked as read' };
  }

  // ─── Send Push ────────────────────────────────────────────────────────────

  async sendPush(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    // Store in DB
    await this.db.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'push', $2, $3, $4)`,
      [userId, title, body, data ? JSON.stringify(data) : null],
    );

    // Queue FCM send
    await this.notifQueue.add('send-push', { userId, title, body, data });
  }

  async sendPushImmediate(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!this.firebaseInitialized) {
      this.logger.debug(`[FCM disabled] To: ${fcmToken} | ${title}: ${body}`);
      return;
    }
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (err) {
      this.logger.error(`FCM send failed: ${err.message}`);
    }
  }

  // ─── Send SMS ─────────────────────────────────────────────────────────────

  async sendSMS(phone: string, message: string): Promise<void> {
    const apiKey = this.config.get<string>('MSG91_API_KEY');
    const senderId = this.config.get<string>('MSG91_SENDER_ID', 'LCLFSN');

    if (!apiKey) {
      this.logger.debug(`[SMS disabled] To: ${phone} | ${message}`);
      return;
    }
    try {
      await axios.get('https://api.msg91.com/api/sendhttp.php', {
        params: {
          authkey: apiKey,
          mobiles: phone.replace('+', ''),
          message,
          sender: senderId,
          route: 4,
          country: 91,
        },
      });
    } catch (err) {
      this.logger.error(`SMS send failed to ${phone}: ${err.message}`);
    }
  }

  // ─── Broadcast ───────────────────────────────────────────────────────────

  async sendToAll(cityId: string, role: string, title: string, body: string, data?: Record<string, string>): Promise<{ queued: number }> {
    const result = await this.db.query(
      'SELECT id FROM users WHERE city_id = $1 AND role = $2 AND is_active = true AND fcm_token IS NOT NULL',
      [cityId, role],
    );
    const userIds = result.rows.map((r) => r.id);

    // Queue bulk notifications
    await this.notifQueue.add('broadcast', { userIds, title, body, data, cityId, role });

    return { queued: userIds.length };
  }

  async broadcastToCity(cityId: string, title: string, body: string): Promise<{ queued: number }> {
    // Store for all active users in city
    const result = await this.db.query(
      'SELECT id FROM users WHERE city_id = $1 AND is_active = true',
      [cityId],
    );

    if (result.rows.length > 0) {
      // Bulk insert notifications
      const values = result.rows.map((_, i) => `($${i * 4 + 1}, 'broadcast', $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ');
      const params: any[] = [];
      for (const row of result.rows) {
        params.push(row.id, title, body, null);
      }
      await this.db.query(
        `INSERT INTO notifications (user_id, type, title, body, data) VALUES ${values}`,
        params,
      );
    }

    // Queue FCM sends
    await this.notifQueue.add('broadcast', {
      userIds: result.rows.map((r) => r.id),
      title, body,
    });

    return { queued: result.rows.length };
  }
}
