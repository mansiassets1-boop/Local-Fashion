import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query(
      `SELECT id, name, slug, icon_url, parent_id, sort_order, is_active
       FROM categories
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`,
    );

    // Build tree structure
    return this.buildTree(result.rows);
  }

  async findById(id: string) {
    const result = await this.db.query(
      'SELECT * FROM categories WHERE id = $1',
      [id],
    );
    return result.rows[0] || null;
  }

  async create(dto: CreateCategoryDto) {
    const result = await this.db.query(
      `INSERT INTO categories (name, slug, icon_url, parent_id, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        dto.name, dto.slug, dto.icon_url || null,
        dto.parent_id || null, dto.sort_order ?? 0, dto.is_active ?? true,
      ],
    );
    return result.rows[0];
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findById(id);
    if (!category) throw new NotFoundException('Category not found');

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowed = ['name', 'slug', 'icon_url', 'parent_id', 'sort_order', 'is_active'];
    for (const key of allowed) {
      if ((dto as any)[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push((dto as any)[key]);
      }
    }

    if (fields.length === 0) return category;
    values.push(id);

    const result = await this.db.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  private buildTree(categories: any[]) {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id).children.push(map.get(cat.id));
      } else if (!cat.parent_id) {
        roots.push(map.get(cat.id));
      }
    }

    return roots;
  }
}
