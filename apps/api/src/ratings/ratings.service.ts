import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRatingDto } from './dto/ratings.dto';

@Injectable()
export class RatingsService {
  constructor(private readonly db: DatabaseService) {}

  async createRating(userId: string, dto: CreateRatingDto) {
    // Verify order belongs to user and is delivered
    const orderResult = await this.db.query(
      `SELECT o.id, o.store_id,
              oi.product_id,
              da.partner_id AS delivery_partner_id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN delivery_assignments da ON da.order_id = o.id AND da.status = 'accepted'
       WHERE o.id = $1 AND o.buyer_id = $2 AND o.status = 'delivered'
       LIMIT 1`,
      [dto.order_id, userId],
    );
    if (!orderResult.rows[0]) {
      throw new BadRequestException('Order not found or not delivered');
    }
    const order = orderResult.rows[0];

    // Check for existing rating
    const existing = await this.db.query(
      'SELECT id FROM ratings WHERE order_id = $1',
      [dto.order_id],
    );
    if (existing.rows[0]) throw new BadRequestException('Rating already submitted for this order');

    const result = await this.db.query(
      `INSERT INTO ratings (order_id, buyer_id, product_id, delivery_id, product_rating, delivery_rating, review_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        dto.order_id, userId, order.product_id, order.delivery_partner_id || null,
        dto.product_rating || null, dto.delivery_rating || null, dto.review_text || null,
      ],
    );

    // Update delivery partner avg rating
    if (order.delivery_partner_id && dto.delivery_rating) {
      await this.db.query(
        `UPDATE delivery_partners dp
         SET avg_rating = (
           SELECT AVG(r.delivery_rating)
           FROM ratings r
           WHERE r.delivery_id = $1 AND r.delivery_rating IS NOT NULL
         )
         WHERE id = $1`,
        [order.delivery_partner_id],
      );
    }

    return result.rows[0];
  }

  async getProductRatings(productId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await this.db.query(
      `SELECT r.id, r.product_rating, r.delivery_rating, r.review_text, r.created_at,
              u.name AS reviewer_name
       FROM ratings r
       JOIN users u ON u.id = r.buyer_id
       WHERE r.product_id = $1 AND r.product_rating IS NOT NULL
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset],
    );

    const statsResult = await this.db.query(
      `SELECT
         COALESCE(AVG(product_rating), 0) AS avg_rating,
         COUNT(*) AS total,
         COUNT(CASE WHEN product_rating = 5 THEN 1 END) AS five_star,
         COUNT(CASE WHEN product_rating = 4 THEN 1 END) AS four_star,
         COUNT(CASE WHEN product_rating = 3 THEN 1 END) AS three_star,
         COUNT(CASE WHEN product_rating = 2 THEN 1 END) AS two_star,
         COUNT(CASE WHEN product_rating = 1 THEN 1 END) AS one_star
       FROM ratings WHERE product_id = $1 AND product_rating IS NOT NULL`,
      [productId],
    );

    return {
      items: result.rows,
      stats: statsResult.rows[0],
      page, limit,
    };
  }
}
