import type { Pool, QueryResultRow } from 'pg';

export interface ProductFilters {
  category?: string;
  search?: string;
}

export interface CatalogProductRow extends QueryResultRow {
  id: string;
  name: string;
  category: string;
  selling_unit: string;
  price_idr: number | string;
  image_url: string | null;
  available_quantity: number | string;
}

export class ProductRepository {
  constructor(private readonly database: Pick<Pool, 'query'>) {}

  async listActive(filters: ProductFilters = {}): Promise<CatalogProductRow[]> {
    const result = await this.database.query<CatalogProductRow>(
      `SELECT
         products.id,
         products.name,
         products.category,
         products.selling_unit,
         products.price_idr,
         products.image_url,
         (inventory.on_hand - inventory.reserved) AS available_quantity
       FROM products
       JOIN inventory ON inventory.product_id = products.id
       WHERE products.is_active = true
         AND ($1::text IS NULL OR products.category = $1)
         AND ($2::text IS NULL OR products.name ILIKE '%' || $2 || '%')
       ORDER BY products.category ASC, products.name ASC`,
      [filters.category ?? null, filters.search ?? null],
    );

    return result.rows;
  }
}