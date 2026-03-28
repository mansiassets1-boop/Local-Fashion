import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByPhone(phone: string) {
    const result = await this.db.query(
      'SELECT id, phone, role, city_id, name, email, fcm_token, is_active FROM users WHERE phone = $1',
      [phone],
    );
    return result.rows[0] || null;
  }

  async findById(id: string) {
    const result = await this.db.query(
      'SELECT id, phone, role, city_id, name, email, gender, size_pref, fcm_token, is_active, created_at FROM users WHERE id = $1',
      [id],
    );
    return result.rows[0] || null;
  }

  async create(data: {
    phone: string;
    role?: string;
    city_id?: string;
    name?: string;
    fcm_token?: string;
  }) {
    const role = data.role || 'buyer';
    const result = await this.db.query(
      `INSERT INTO users (phone, role, city_id, name, fcm_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, phone, role, city_id, name, fcm_token, is_active, created_at`,
      [data.phone, role, data.city_id || null, data.name || null, data.fcm_token || null],
    );
    return result.rows[0];
  }

  async updateFcmToken(userId: string, fcmToken: string | null) {
    await this.db.query(
      'UPDATE users SET fcm_token = $1 WHERE id = $2',
      [fcmToken, userId],
    );
  }

  async updateCityId(userId: string, cityId: string) {
    await this.db.query(
      'UPDATE users SET city_id = $1 WHERE id = $2',
      [cityId, userId],
    );
  }

  async getOrCreate(phone: string, data: { role?: string; city_id?: string; fcm_token?: string }) {
    let user = await this.findByPhone(phone);
    if (!user) {
      user = await this.create({ phone, ...data });
    } else {
      if (data.fcm_token) {
        await this.updateFcmToken(user.id, data.fcm_token);
        user.fcm_token = data.fcm_token;
      }
      if (data.city_id && !user.city_id) {
        await this.updateCityId(user.id, data.city_id);
        user.city_id = data.city_id;
      }
    }
    return user;
  }
}
