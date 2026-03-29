import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

const SOFT_LOCK_MINS = 10;
const DELIVERY_FEE_BASE = 40;

@Injectable()
export class CartService {
  constructor(private readonly db: DatabaseService) {}

  // ─── Get Cart ─────────────────────────────────────────────────────────────

  async getCart(userId: string) {
    const itemsResult = await this.db.query(
      `SELECT ci.id, ci.variant_id, ci.quantity,
              v.size, v.color, v.color_hex, v.stock_quantity,
              COALESCE(v.price_override, p.price) AS unit_price,
              p.id AS product_id, p.name AS product_name, p.mrp,
              pi.url AS primary_image,
              s.id AS store_id, s.name AS store_name, s.prep_time_mins,
              cl.expires_at AS lock_expires_at
       FROM cart_items ci
       JOIN variants v ON v.id = ci.variant_id
       JOIN products p ON p.id = v.product_id
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
       JOIN stores s ON s.id = p.store_id
       LEFT JOIN cart_locks cl ON cl.variant_id = ci.variant_id
         AND cl.user_id = $1 AND cl.lock_type = 'soft' AND cl.expires_at > NOW()
       WHERE ci.user_id = $1`,
      [userId],
    );

    // Refresh expired locks and validate stock
    const items = await Promise.all(
      itemsResult.rows.map(async (item) => {
        const isOutOfStock = item.stock_quantity < item.quantity;
        const isLockExpired = !item.lock_expires_at;

        // Refresh lock if expired
        if (isLockExpired && !isOutOfStock) {
          await this.upsertSoftLock(userId, item.variant_id, item.quantity);
        }

        return {
          ...item,
          is_out_of_stock: isOutOfStock,
          lock_expires_at: item.lock_expires_at || new Date(Date.now() + SOFT_LOCK_MINS * 60 * 1000),
        };
      }),
    );

    const subtotal = items
      .filter((i) => !i.is_out_of_stock)
      .reduce((sum, i) => sum + parseFloat(i.unit_price) * i.quantity, 0);

    const deliveryFee = items.length > 0 ? DELIVERY_FEE_BASE : 0;
    const total = subtotal + deliveryFee;

    return { items, subtotal, delivery_fee: deliveryFee, total };
  }

  // ─── Add Item ─────────────────────────────────────────────────────────────

  async addItem(userId: string, dto: AddCartItemDto) {
    return this.db.transaction(async (client) => {
      // Lock the variant row for update
      const variantResult = await client.query(
        'SELECT id, stock_quantity, product_id FROM variants WHERE id = $1 FOR UPDATE',
        [dto.variant_id],
      );
      const variant = variantResult.rows[0];
      if (!variant) throw new NotFoundException('Variant not found');

      // Verify product is active
      const productResult = await client.query(
        `SELECT p.id FROM products p
         JOIN stores s ON s.id = p.store_id
         WHERE p.id = $1 AND p.is_active = true AND s.status = 'active'`,
        [variant.product_id],
      );
      if (!productResult.rows[0]) throw new BadRequestException('Product not available');

      // Check effective available stock (accounting for locks)
      const locksResult = await client.query(
        `SELECT COALESCE(SUM(quantity), 0) AS locked
         FROM cart_locks
         WHERE variant_id = $1 AND expires_at > NOW() AND user_id != $2`,
        [dto.variant_id, userId],
      );
      const otherLocked = parseInt(locksResult.rows[0].locked);
      const available = variant.stock_quantity - otherLocked;

      if (available < dto.quantity) {
        throw new BadRequestException(
          `Only ${available} unit(s) available for this variant`,
        );
      }

      // Upsert cart item
      await client.query(
        `INSERT INTO cart_items (user_id, variant_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, variant_id)
         DO UPDATE SET quantity = $3`,
        [userId, dto.variant_id, dto.quantity],
      );

      // Upsert soft lock (10 min)
      const expiresAt = new Date(Date.now() + SOFT_LOCK_MINS * 60 * 1000);
      await client.query(
        `INSERT INTO cart_locks (variant_id, user_id, quantity, lock_type, expires_at)
         VALUES ($1, $2, $3, 'soft', $4)
         ON CONFLICT DO NOTHING`,
        [dto.variant_id, userId, dto.quantity, expiresAt],
      );

      return { message: 'Item added to cart' };
    });
  }

  // ─── Update Item ──────────────────────────────────────────────────────────

  async updateItem(cartItemId: string, userId: string, dto: UpdateCartItemDto) {
    return this.db.transaction(async (client) => {
      const itemResult = await client.query(
        'SELECT ci.id, ci.variant_id FROM cart_items ci WHERE ci.id = $1 AND ci.user_id = $2',
        [cartItemId, userId],
      );
      if (!itemResult.rows[0]) throw new NotFoundException('Cart item not found');

      const variantResult = await client.query(
        'SELECT id, stock_quantity FROM variants WHERE id = $1 FOR UPDATE',
        [itemResult.rows[0].variant_id],
      );
      const variant = variantResult.rows[0];

      if (variant.stock_quantity < dto.quantity) {
        throw new BadRequestException(`Only ${variant.stock_quantity} units available`);
      }

      await client.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [dto.quantity, cartItemId],
      );

      // Refresh lock
      const expiresAt = new Date(Date.now() + SOFT_LOCK_MINS * 60 * 1000);
      await client.query(
        `UPDATE cart_locks SET quantity = $1, expires_at = $2
         WHERE variant_id = $3 AND user_id = $4 AND lock_type = 'soft'`,
        [dto.quantity, expiresAt, variant.id, userId],
      );

      return { message: 'Cart item updated' };
    });
  }

  // ─── Remove Item ──────────────────────────────────────────────────────────

  async removeItem(cartItemId: string, userId: string) {
    const itemResult = await this.db.query(
      'SELECT id, variant_id FROM cart_items WHERE id = $1 AND user_id = $2',
      [cartItemId, userId],
    );
    if (!itemResult.rows[0]) throw new NotFoundException('Cart item not found');

    await this.db.transaction(async (client) => {
      await client.query('DELETE FROM cart_items WHERE id = $1', [cartItemId]);
      await client.query(
        "DELETE FROM cart_locks WHERE variant_id = $1 AND user_id = $2 AND lock_type = 'soft'",
        [itemResult.rows[0].variant_id, userId],
      );
    });

    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string, client?: any) {
    const db = client || this.db;
    if (client) {
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      await client.query(
        "DELETE FROM cart_locks WHERE user_id = $1 AND lock_type = 'soft'",
        [userId],
      );
    } else {
      await this.db.transaction(async (c) => {
        await c.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        await c.query(
          "DELETE FROM cart_locks WHERE user_id = $1 AND lock_type = 'soft'",
          [userId],
        );
      });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async upsertSoftLock(userId: string, variantId: string, quantity: number) {
    const expiresAt = new Date(Date.now() + SOFT_LOCK_MINS * 60 * 1000);
    await this.db.query(
      `INSERT INTO cart_locks (variant_id, user_id, quantity, lock_type, expires_at)
       VALUES ($1, $2, $3, 'soft', $4)
       ON CONFLICT DO NOTHING`,
      [variantId, userId, quantity, expiresAt],
    );
  }
}
