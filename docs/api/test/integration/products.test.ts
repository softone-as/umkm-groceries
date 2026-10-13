import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';
import { createApp } from '../../src/app.js';

const database = newDb();
database.public.none(`
  CREATE TABLE products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    selling_unit TEXT NOT NULL,
    price_idr BIGINT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL
  );
  CREATE TABLE inventory (
    product_id UUID PRIMARY KEY REFERENCES products(id),
    on_hand INTEGER NOT NULL,
    reserved INTEGER NOT NULL
  );
  CREATE TABLE store_settings (
    id INTEGER PRIMARY KEY,
    shop_name TEXT NOT NULL,
    address TEXT NOT NULL,
    pickup_hours TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    bank_instructions TEXT NOT NULL
  );
  INSERT INTO products VALUES
    ('00000000-0000-4000-8000-000000000001', 'Beras Rojolele', 'Beras', 'kg', 15000, NULL, true),
    ('00000000-0000-4000-8000-000000000002', 'Beras Nonaktif', 'Beras', 'kg', 12000, NULL, false),
    ('00000000-0000-4000-8000-000000000003', 'Minyak Goreng', 'Minyak Goreng', 'liter', 18000, NULL, true);
  INSERT INTO inventory VALUES
    ('00000000-0000-4000-8000-000000000001', 10, 3),
    ('00000000-0000-4000-8000-000000000002', 10, 0),
    ('00000000-0000-4000-8000-000000000003', 5, 5);
  INSERT INTO store_settings VALUES
    (1, 'Toko Berkah', 'Jl. Pasar', '08.00-17.00', '6281234567890', 'BCA 123');
`);

const { Pool } = database.adapters.createPg();
const pool = new Pool();
const app = createApp({ pool });

afterAll(async () => {
  await pool.end();
});

describe('GET /api/v1/products', () => {
  it('returns active products with available stock in the standard success envelope', async () => {
    const response = await request(app).get('/api/v1/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        products: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'Beras Rojolele',
            category: 'Beras',
            selling_unit: 'kg',
            price_idr: 15000,
            image_url: null,
            available_quantity: 7,
            is_available: true,
          },
          {
            id: '00000000-0000-4000-8000-000000000003',
            name: 'Minyak Goreng',
            category: 'Minyak Goreng',
            selling_unit: 'liter',
            price_idr: 18000,
            image_url: null,
            available_quantity: 0,
            is_available: false,
          },
        ],
      },
    });
  });

  it('reports exhausted stock as unavailable and filters by exact category and case-insensitive search', async () => {
    const filtered = await request(app).get('/api/v1/products?category=Minyak%20Goreng&search=GORENG');

    expect(filtered.status).toBe(200);
    expect(filtered.body.data.products).toEqual([
      expect.objectContaining({
        id: '00000000-0000-4000-8000-000000000003',
        available_quantity: 0,
        is_available: false,
      }),
    ]);
  });

  it('returns the public store profile with the documented bank transfer field', async () => {
    const response = await request(app).get('/api/v1/store-settings');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        shop_name: 'Toko Berkah',
        address: 'Jl. Pasar',
        pickup_hours: '08.00-17.00',
        whatsapp_number: '6281234567890',
        bank_transfer_instructions: 'BCA 123',
      },
    });
  });
});
