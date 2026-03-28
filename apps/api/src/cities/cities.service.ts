import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCityDto, UpdateCityDto } from './dto/cities.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query(
      'SELECT id, name, lat, lng, delivery_radius_km, is_active FROM cities WHERE is_active = true ORDER BY name',
    );
    return result.rows;
  }

  async findById(id: string) {
    const result = await this.db.query(
      'SELECT * FROM cities WHERE id = $1',
      [id],
    );
    return result.rows[0] || null;
  }

  async create(dto: CreateCityDto) {
    const result = await this.db.query(
      `INSERT INTO cities (name, lat, lng, delivery_radius_km, platform_fee_pct, sla_accept_mins, sla_ready_mins, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        dto.name, dto.lat, dto.lng,
        dto.delivery_radius_km ?? 15,
        dto.platform_fee_pct ?? 15.00,
        dto.sla_accept_mins ?? 15,
        dto.sla_ready_mins ?? 30,
        dto.is_active ?? false,
      ],
    );
    return result.rows[0];
  }

  async update(id: string, dto: UpdateCityDto) {
    const city = await this.findById(id);
    if (!city) throw new NotFoundException('City not found');

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowed = ['name', 'lat', 'lng', 'delivery_radius_km', 'platform_fee_pct', 'sla_accept_mins', 'sla_ready_mins', 'is_active'];
    for (const key of allowed) {
      if ((dto as any)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push((dto as any)[key]);
      }
    }

    if (fields.length === 0) return city;
    values.push(id);

    const result = await this.db.query(
      `UPDATE cities SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async getHomeData(cityId: string, lat?: number, lng?: number) {
    // Banners: active, city-scoped (or global)
    const bannersResult = await this.db.query(
      `SELECT id, title, image_url, link_url, sort_order
       FROM banners
       WHERE (city_id = $1 OR city_id IS NULL)
         AND is_active = true
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY sort_order ASC
       LIMIT 10`,
      [cityId],
    );

    // Trending products (top 20 by sold_count in last 7 days)
    const trendingResult = await this.db.query(
      `SELECT p.id, p.name, p.price, p.mrp, p.brand, p.sold_count,
              pi.url AS primary_image, s.name AS store_name, s.id AS store_id
       FROM products p
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
       LEFT JOIN stores s ON s.id = p.store_id
       WHERE p.city_id = $1
         AND p.is_active = true
         AND s.status = 'active'
         AND p.updated_at >= NOW() - INTERVAL '7 days'
       ORDER BY p.sold_count DESC
       LIMIT 20`,
      [cityId],
    );

    // New arrivals (last 72h)
    const newArrivalsResult = await this.db.query(
      `SELECT p.id, p.name, p.price, p.mrp, p.brand, p.created_at,
              pi.url AS primary_image, s.name AS store_name, s.id AS store_id
       FROM products p
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
       LEFT JOIN stores s ON s.id = p.store_id
       WHERE p.city_id = $1
         AND p.is_active = true
         AND s.status = 'active'
         AND p.created_at >= NOW() - INTERVAL '72 hours'
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [cityId],
    );

    // Nearby stores (sorted by distance if coordinates provided)
    let nearbyStores = [];
    if (lat && lng) {
      const nearbyResult = await this.db.query(
        `SELECT s.id, s.name, s.address, s.logo_url, s.lat, s.lng,
                ST_Distance(
                  ST_MakePoint(s.lng, s.lat)::geography,
                  ST_MakePoint($2, $3)::geography
                ) AS distance_meters,
                COALESCE(AVG(r.product_rating), 0) AS avg_rating,
                COUNT(DISTINCT r.id) AS review_count
         FROM stores s
         LEFT JOIN orders o ON o.store_id = s.id AND o.status = 'delivered'
         LEFT JOIN ratings r ON r.order_id = o.id
         WHERE s.city_id = $1
           AND s.status = 'active'
         GROUP BY s.id
         ORDER BY distance_meters ASC
         LIMIT 10`,
        [cityId, lng, lat],
      );
      nearbyStores = nearbyResult.rows;
    } else {
      const storesResult = await this.db.query(
        `SELECT s.id, s.name, s.address, s.logo_url,
                COALESCE(AVG(r.product_rating), 0) AS avg_rating,
                COUNT(DISTINCT r.id) AS review_count
         FROM stores s
         LEFT JOIN orders o ON o.store_id = s.id AND o.status = 'delivered'
         LEFT JOIN ratings r ON r.order_id = o.id
         WHERE s.city_id = $1 AND s.status = 'active'
         GROUP BY s.id
         ORDER BY s.created_at DESC
         LIMIT 10`,
        [cityId],
      );
      nearbyStores = storesResult.rows;
    }

    return {
      banners: bannersResult.rows,
      trending_products: trendingResult.rows,
      new_arrivals: newArrivalsResult.rows,
      nearby_stores: nearbyStores,
    };
  }
}
