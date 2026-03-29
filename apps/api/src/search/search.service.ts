import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SearchService {
  constructor(private readonly db: DatabaseService) {}

  async search(query: string, cityId: string, userId?: string, limit = 20) {
    if (!query || query.trim().length < 2) {
      return { products: [], stores: [], autocomplete: [] };
    }

    const q = query.trim();

    // Full-text search products (tsvector)
    const productsResult = await this.db.query(
      `SELECT p.id, p.name, p.price, p.mrp, p.brand, p.store_id,
              pi.url AS primary_image,
              s.name AS store_name,
              ts_rank(p.search_vector, plainto_tsquery('english', $1)) AS rank
       FROM products p
       JOIN stores s ON s.id = p.store_id AND s.status = 'active'
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
       WHERE p.city_id = $2
         AND p.is_active = true
         AND p.search_vector @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC, p.sold_count DESC
       LIMIT $3`,
      [q, cityId, limit],
    );

    // Search stores (trigram similarity)
    const storesResult = await this.db.query(
      `SELECT s.id, s.name, s.logo_url, s.address,
              similarity(s.name, $1) AS sim_score
       FROM stores s
       WHERE s.city_id = $2
         AND s.status = 'active'
         AND s.name ILIKE $3
       ORDER BY sim_score DESC
       LIMIT 5`,
      [q, cityId, `%${q}%`],
    );

    // Log search
    await this.db.query(
      `INSERT INTO search_logs (user_id, city_id, query, results_count)
       VALUES ($1, $2, $3, $4)`,
      [userId || null, cityId, q, productsResult.rows.length + storesResult.rows.length],
    ).catch(() => {}); // Non-critical

    // Get autocomplete suggestions from popular searches
    const autocompleteResult = await this.db.query(
      `SELECT query, COUNT(*) AS count
       FROM search_logs
       WHERE city_id = $1
         AND query ILIKE $2
         AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY query
       ORDER BY count DESC
       LIMIT 5`,
      [cityId, `${q}%`],
    );

    return {
      products: productsResult.rows,
      stores: storesResult.rows,
      autocomplete: autocompleteResult.rows.map((r) => r.query),
    };
  }

  async getPopularSearches(cityId: string) {
    const result = await this.db.query(
      `SELECT query, COUNT(*) AS count
       FROM search_logs
       WHERE city_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY query
       ORDER BY count DESC
       LIMIT 10`,
      [cityId],
    );
    return result.rows;
  }
}
