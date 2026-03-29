import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OnboardSellerDto, UpdateStoreDto } from './dto/stores.dto';

@Injectable()
export class StoresService {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string) {
    const result = await this.db.query(
      `SELECT s.*,
              COUNT(DISTINCT p.id) AS product_count,
              COALESCE(AVG(r.product_rating), 0) AS avg_rating,
              COUNT(DISTINCT r.id) AS review_count,
              s.created_at AS member_since
       FROM stores s
       LEFT JOIN products p ON p.store_id = s.id AND p.is_active = true
       LEFT JOIN orders o ON o.store_id = s.id AND o.status = 'delivered'
       LEFT JOIN ratings r ON r.order_id = o.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Store not found');
    return result.rows[0];
  }

  async getStoreProducts(storeId: string, query: any) {
    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(50, parseInt(query.limit || '20'));
    const offset = (page - 1) * limit;

    const params: any[] = [storeId];
    let orderBy = 'p.created_at DESC';

    if (query.sort === 'price_asc') orderBy = 'p.price ASC';
    else if (query.sort === 'price_desc') orderBy = 'p.price DESC';
    else if (query.sort === 'sold_count') orderBy = 'p.sold_count DESC';

    const result = await this.db.query(
      `SELECT p.id, p.name, p.price, p.mrp, p.brand, p.sold_count, p.is_active,
              p.created_at, pi.url AS primary_image,
              COALESCE(AVG(r.product_rating), 0) AS avg_rating,
              COUNT(DISTINCT r.id) AS review_count
       FROM products p
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
       LEFT JOIN orders o ON o.store_id = $1 AND o.status = 'delivered'
       LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p.id
       LEFT JOIN ratings r ON r.order_id = o.id AND r.product_id = p.id
       WHERE p.store_id = $1 AND p.is_active = true
       GROUP BY p.id, pi.url
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [storeId, limit, offset],
    );

    const countResult = await this.db.query(
      'SELECT COUNT(*) FROM products WHERE store_id = $1 AND is_active = true',
      [storeId],
    );

    return {
      items: result.rows,
      total: parseInt(countResult.rows[0].count),
      page, limit,
    };
  }

  async followStore(userId: string, storeId: string) {
    const store = await this.db.query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (!store.rows[0]) throw new NotFoundException('Store not found');

    try {
      await this.db.query(
        'INSERT INTO store_follows (user_id, store_id) VALUES ($1, $2)',
        [userId, storeId],
      );
    } catch (err) {
      if (err.code === '23505') throw new ConflictException('Already following this store');
      throw err;
    }
    return { message: 'Store followed' };
  }

  async unfollowStore(userId: string, storeId: string) {
    const result = await this.db.query(
      'DELETE FROM store_follows WHERE user_id = $1 AND store_id = $2',
      [userId, storeId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Follow record not found');
    return { message: 'Store unfollowed' };
  }

  async onboardSeller(userId: string, cityId: string, dto: OnboardSellerDto) {
    // Check if user already has a store
    const existing = await this.db.query(
      'SELECT id FROM stores WHERE owner_user_id = $1',
      [userId],
    );
    if (existing.rows.length > 0) throw new ConflictException('You already have a store');

    const result = await this.db.query(
      `INSERT INTO stores (
        owner_user_id, city_id, name, address, lat, lng, location,
        category_id, description, gst_number, bank_account, bank_ifsc,
        id_proof_url, logo_url, banner_url, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        ST_SetSRID(ST_MakePoint($7, $6), 4326)::geography,
        $8, $9, $10, $11, $12, $13, $14, $15, 'pending'
      ) RETURNING *`,
      [
        userId, cityId, dto.name, dto.address, dto.lat, dto.lng,
        dto.lng,
        dto.category_id || null, dto.description || null,
        dto.gst_number || null, dto.bank_account || null, dto.bank_ifsc || null,
        dto.id_proof_url || null, dto.logo_url || null, dto.banner_url || null,
      ],
    );

    // Update user role to seller
    await this.db.query(
      "UPDATE users SET role = 'seller' WHERE id = $1",
      [userId],
    );

    return result.rows[0];
  }

  async updateStore(userId: string, dto: UpdateStoreDto) {
    const store = await this.db.query(
      'SELECT id, owner_user_id FROM stores WHERE owner_user_id = $1',
      [userId],
    );
    if (!store.rows[0]) throw new NotFoundException('Store not found');

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowed = [
      'name', 'description', 'address', 'lat', 'lng', 'logo_url', 'banner_url',
      'return_policy_days', 'prep_time_mins', 'gst_number', 'bank_account', 'bank_ifsc',
    ];
    for (const key of allowed) {
      if ((dto as any)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push((dto as any)[key]);
      }
    }

    // Update location geometry if lat/lng changed
    if (dto.lat !== undefined && dto.lng !== undefined) {
      fields.push(`location = ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)::geography`);
      values.push(dto.lng, dto.lat);
    }

    if (fields.length === 0) return store.rows[0];
    values.push(store.rows[0].id);

    const result = await this.db.query(
      `UPDATE stores SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async findByOwnerId(userId: string) {
    const result = await this.db.query(
      'SELECT * FROM stores WHERE owner_user_id = $1',
      [userId],
    );
    return result.rows[0] || null;
  }
}
