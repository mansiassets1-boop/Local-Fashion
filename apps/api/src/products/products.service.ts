import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EtaService } from '../eta/eta.service';
import {
  CreateProductDto, UpdateProductDto, ProductsQueryDto, AddVariantDto, UpdateStockDto,
} from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly etaService: EtaService,
  ) {}

  // ─── Listing with all filters ─────────────────────────────────────────────

  async findAll(query: ProductsQueryDto) {
    const page = Math.max(1, +(query.page || 1));
    const limit = Math.min(100, +(query.limit || 20));
    const offset = (page - 1) * limit;

    const params: any[] = [];
    const conditions: string[] = ['p.is_active = true', 's.status = \'active\''];
    let idx = 1;

    // MANDATORY: city scope
    if (query.city_id) {
      conditions.push(`p.city_id = $${idx++}`);
      params.push(query.city_id);
    }

    // Full-text search
    if (query.q) {
      conditions.push(`p.search_vector @@ plainto_tsquery('english', $${idx++})`);
      params.push(query.q);
    }

    // Category filter
    if (query.category_id) {
      conditions.push(`p.category_id = $${idx++}`);
      params.push(query.category_id);
    }

    // Sizes filter (join variants)
    const sizes = this.toArray(query.sizes);
    if (sizes.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM variants v2
        WHERE v2.product_id = p.id AND v2.size = ANY($${idx++})
          AND v2.stock_quantity > 0
      )`);
      params.push(sizes);
    }

    // Colors filter
    const colors = this.toArray(query.colors);
    if (colors.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM variants v3
        WHERE v3.product_id = p.id AND v3.color = ANY($${idx++})
          AND v3.stock_quantity > 0
      )`);
      params.push(colors);
    }

    // Price range
    if (query.min_price) {
      conditions.push(`p.price >= $${idx++}`);
      params.push(+query.min_price);
    }
    if (query.max_price) {
      conditions.push(`p.price <= $${idx++}`);
      params.push(+query.max_price);
    }

    // Brand filter
    if (query.brand) {
      conditions.push(`LOWER(p.brand) LIKE LOWER($${idx++})`);
      params.push(`%${query.brand}%`);
    }

    // Store filter
    if (query.store_id) {
      conditions.push(`p.store_id = $${idx++}`);
      params.push(query.store_id);
    }

    // Min rating filter
    if (query.min_rating) {
      conditions.push(`(
        SELECT COALESCE(AVG(r.product_rating), 0)
        FROM ratings r
        JOIN orders o ON o.id = r.order_id
        WHERE r.product_id = p.id
      ) >= $${idx++}`);
      params.push(+query.min_rating);
    }

    // Sort
    let orderBy = 'p.created_at DESC';
    if (query.sort === 'sold_count') orderBy = 'p.sold_count DESC';
    else if (query.sort === 'price_asc') orderBy = 'p.price ASC';
    else if (query.sort === 'price_desc') orderBy = 'p.price DESC';
    else if (query.sort === 'avg_rating') orderBy = 'avg_rating DESC';

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT p.id, p.name, p.price, p.mrp, p.brand, p.sold_count, p.city_id,
             p.category_id, p.created_at, p.store_id,
             pi.url AS primary_image,
             s.name AS store_name, s.prep_time_mins,
             COALESCE(AVG(r.product_rating), 0) AS avg_rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM products p
      JOIN stores s ON s.id = p.store_id
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      LEFT JOIN orders o ON o.store_id = p.store_id AND o.status = 'delivered'
      LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p.id
      LEFT JOIN ratings r ON r.order_id = o.id AND r.product_id = p.id
      ${where}
      GROUP BY p.id, pi.url, s.name, s.prep_time_mins
      ORDER BY ${orderBy}
      LIMIT $${idx++} OFFSET $${idx}
    `;
    params.push(limit, offset);

    const countSql = `
      SELECT COUNT(DISTINCT p.id)
      FROM products p
      JOIN stores s ON s.id = p.store_id
      ${where}
    `;

    const [itemsResult, countResult] = await Promise.all([
      this.db.query(sql, params),
      this.db.query(countSql, params.slice(0, -2)),
    ]);

    // Append ETA to each product
    const items = await Promise.all(
      itemsResult.rows.map(async (product) => ({
        ...product,
        eta_mins: this.etaService.calculateEta(product.prep_time_mins || 20, 5000),
      })),
    );

    return {
      items,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  // ─── Product detail ───────────────────────────────────────────────────────

  async findById(id: string, cityId?: string) {
    const result = await this.db.query(
      `SELECT p.*, s.id AS store_id, s.name AS store_name, s.logo_url AS store_logo,
              s.address AS store_address, s.prep_time_mins, s.return_policy_days,
              s.avg_rating AS store_rating, s.city_id AS store_city_id,
              COALESCE(AVG(r.product_rating), 0) AS avg_rating,
              COUNT(DISTINCT r.id) AS review_count
       FROM products p
       JOIN stores s ON s.id = p.store_id
       LEFT JOIN orders o ON o.store_id = s.id AND o.status = 'delivered'
       LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p.id
       LEFT JOIN ratings r ON r.order_id = o.id AND r.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, s.id`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Product not found');

    const product = result.rows[0];

    // Get images
    const imagesResult = await this.db.query(
      'SELECT id, url, is_primary, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC',
      [id],
    );

    // Get variants
    const variantsResult = await this.db.query(
      'SELECT id, size, color, color_hex, stock_quantity, sku, price_override FROM variants WHERE product_id = $1',
      [id],
    );

    // Similar products
    const similarResult = await this.db.query(
      `SELECT p2.id, p2.name, p2.price, p2.mrp, pi2.url AS primary_image
       FROM products p2
       LEFT JOIN product_images pi2 ON pi2.product_id = p2.id AND pi2.is_primary = true
       WHERE p2.category_id = $1
         AND p2.store_id != $2
         AND p2.city_id = $3
         AND p2.is_active = true
         AND p2.id != $4
       ORDER BY p2.sold_count DESC
       LIMIT 8`,
      [product.category_id, product.store_id, product.city_id, id],
    );

    // ETA
    const etaMins = this.etaService.calculateEta(product.prep_time_mins || 20, 5000);

    return {
      ...product,
      images: imagesResult.rows,
      variants: variantsResult.rows,
      similar_products: similarResult.rows,
      eta_mins: etaMins,
    };
  }

  async getVariantAvailability(productId: string) {
    const result = await this.db.query(
      `SELECT v.id, v.size, v.color, v.stock_quantity,
              COALESCE(SUM(cl.quantity), 0) AS locked_quantity,
              v.stock_quantity - COALESCE(SUM(cl.quantity), 0) AS available_quantity
       FROM variants v
       LEFT JOIN cart_locks cl ON cl.variant_id = v.id AND cl.expires_at > NOW()
       WHERE v.product_id = $1
       GROUP BY v.id`,
      [productId],
    );
    return result.rows;
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateProductDto) {
    const storeResult = await this.db.query(
      "SELECT id, city_id FROM stores WHERE owner_user_id = $1 AND status = 'active'",
      [userId],
    );
    if (!storeResult.rows[0]) throw new ForbiddenException('No active store found');

    const store = storeResult.rows[0];

    return this.db.transaction(async (client) => {
      // Insert product
      const productResult = await client.query(
        `INSERT INTO products (store_id, city_id, name, description, price, mrp, category_id, brand, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          store.id, store.city_id, dto.name, dto.description || null,
          dto.price, dto.mrp || null, dto.category_id || null,
          dto.brand || null, dto.tags || null,
        ],
      );
      const product = productResult.rows[0];

      // Insert variants
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          await client.query(
            `INSERT INTO variants (product_id, size, color, color_hex, stock_quantity, sku, price_override)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [product.id, v.size || null, v.color || null, v.color_hex || null,
             v.stock_quantity, v.sku || null, v.price_override || null],
          );
        }
      }

      // Insert images
      if (dto.images && dto.images.length > 0) {
        for (let i = 0; i < dto.images.length; i++) {
          const img = dto.images[i];
          await client.query(
            `INSERT INTO product_images (product_id, url, is_primary, sort_order)
             VALUES ($1, $2, $3, $4)`,
            [product.id, img.url, img.is_primary ?? (i === 0), img.sort_order ?? i],
          );
        }
      }

      return product;
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, userId: string, dto: UpdateProductDto) {
    const product = await this.getProductAndVerifyOwner(id, userId);

    const fields: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let idx = 1;

    const allowed = ['name', 'description', 'price', 'mrp', 'category_id', 'brand', 'tags', 'is_active'];
    for (const key of allowed) {
      if ((dto as any)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push((dto as any)[key]);
      }
    }

    values.push(id);
    const result = await this.db.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async deactivate(id: string, userId: string) {
    await this.getProductAndVerifyOwner(id, userId);
    const result = await this.db.query(
      "UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, is_active",
      [id],
    );
    return result.rows[0];
  }

  // ─── Variants ─────────────────────────────────────────────────────────────

  async addVariant(userId: string, dto: AddVariantDto) {
    await this.getProductAndVerifyOwner(dto.product_id, userId);
    const result = await this.db.query(
      `INSERT INTO variants (product_id, size, color, color_hex, stock_quantity, sku, price_override)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [dto.product_id, dto.size || null, dto.color || null, dto.color_hex || null,
       dto.stock_quantity, dto.sku || null, dto.price_override || null],
    );
    return result.rows[0];
  }

  async updateVariantStock(variantId: string, userId: string, dto: UpdateStockDto) {
    const variantResult = await this.db.query(
      `SELECT v.id, p.store_id FROM variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.id = $1`,
      [variantId],
    );
    if (!variantResult.rows[0]) throw new NotFoundException('Variant not found');

    const storeResult = await this.db.query(
      'SELECT id FROM stores WHERE id = $1 AND owner_user_id = $2',
      [variantResult.rows[0].store_id, userId],
    );
    if (!storeResult.rows[0]) throw new ForbiddenException('Not authorized');

    const result = await this.db.query(
      'UPDATE variants SET stock_quantity = $1 WHERE id = $2 RETURNING *',
      [dto.stock_quantity, variantId],
    );
    return result.rows[0];
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getProductAndVerifyOwner(productId: string, userId: string) {
    const result = await this.db.query(
      `SELECT p.*, s.owner_user_id FROM products p
       JOIN stores s ON s.id = p.store_id
       WHERE p.id = $1`,
      [productId],
    );
    if (!result.rows[0]) throw new NotFoundException('Product not found');
    if (result.rows[0].owner_user_id !== userId) throw new ForbiddenException('Not authorized');
    return result.rows[0];
  }

  private toArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
}
