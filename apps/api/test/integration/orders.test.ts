import request from 'supertest';
import { createHash } from 'node:crypto';
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
    product_id UUID PRIMARY KEY,
    on_hand INTEGER NOT NULL,
    reserved INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE orders (
    id UUID PRIMARY KEY,
    reference_code TEXT UNIQUE NOT NULL,
    guest_token_hash TEXT,
    customer_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    order_state TEXT NOT NULL,
    payment_state TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    total_amount_idr BIGINT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    payload_hash TEXT NOT NULL,
    guest_token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    name_snapshot TEXT NOT NULL,
    unit_snapshot TEXT NOT NULL,
    price_idr_snapshot BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    line_total_idr BIGINT NOT NULL
  );
  CREATE TABLE order_status_history (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    ('00000000-0000-4000-8000-000000000001', 'Beras Rojolele', 'Beras', 'kg', 15000, NULL, true);
  INSERT INTO inventory (product_id, on_hand, reserved)
    VALUES ('00000000-0000-4000-8000-000000000001', 5, 0);
  INSERT INTO store_settings VALUES (1, 'Toko Berkah', 'Jl. Pasar', '08.00-17.00', '6281234567890', 'BCA 123');
`);

const { Pool } = database.adapters.createPg();
const pool = new Pool();
const pgMemPool = {
  query: pool.query.bind(pool),
  connect: async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    client.query = ((text: string, values?: unknown[]) => {
      if (typeof text === 'string' && text.includes(' = ANY($1)') && Array.isArray(values?.[0])) {
        const ids = values[0] as unknown[];
        const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
        const compatibleSql = text.replace(
          /(product_id|id) = ANY\(\$1\)/,
          (_match, column: string) => `${column} IN (${placeholders})`,
        );
        return query(compatibleSql, ids);
      }
      return query(text, values as never);
    }) as typeof client.query;
    return client;
  },
};
const app = createApp({ pool: pgMemPool as Parameters<typeof createApp>[0] extends { pool?: infer T } ? T : never });
let createdReferenceCode: string;
let createdGuestToken: string;

afterAll(async () => {
  await pool.end();
});

describe('POST /api/v1/orders', () => {
  it('requires an Idempotency-Key header', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .send({
        customer_name: 'Budi Santoso',
        whatsapp_number: '081234567890',
        payment_method: 'pay_at_store',
        items: [
          {
            product_id: '00000000-0000-4000-8000-000000000001',
            quantity: 1,
            expected_price_idr: 15000,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('creates a reserved order and returns guest tracking and WhatsApp handoff details', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', 'checkout-001')
      .send({
        customer_name: '  Budi Santoso  ',
        whatsapp_number: '081234567890',
        payment_method: 'bank_transfer',
        items: [
          {
            product_id: '00000000-0000-4000-8000-000000000001',
            quantity: 2,
            expected_price_idr: 15000,
          },
        ],
      });

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    createdReferenceCode = response.body.data.order.reference_code;
    expect(response.body.success).toBe(true);
    expect(response.body.data.order).toEqual(
      expect.objectContaining({
        reference_code: expect.stringMatching(/^ORD-\d{6}-[A-Z0-9]{4}$/),
        order_state: 'submitted',
        payment_state: 'pending',
        total_amount_idr: 30000,
        guest_access_token: expect.stringMatching(/^gsec_[a-f0-9]{32}$/),
        guest_tracking_url: expect.stringContaining('/orders/guest?token='),
        whatsapp_url: expect.stringContaining('https://wa.me/6281234567890?text='),
        items: [
          expect.objectContaining({
            name: 'Beras Rojolele',
            selling_unit: 'kg',
            unit_price_idr: 15000,
            quantity: 2,
            line_total_idr: 30000,
          }),
        ],
        pickup_info: { address: 'Jl. Pasar', pickup_hours: '08.00-17.00' },
      }),
    );
    const token = response.body.data.order.guest_access_token as string;
    createdGuestToken = token;
    const storedOrder = await pool.query(
      'SELECT guest_token_hash FROM orders WHERE idempotency_key = $1',
      ['checkout-001'],
    );
    expect(storedOrder.rows[0].guest_token_hash).toBe(createHash('sha256').update(token).digest('hex'));
    expect(storedOrder.rows[0].guest_token_hash).not.toBe(token);

    const tracking = await request(app).get(`/api/v1/guest/orders/${token}`);
    expect(tracking.status).toBe(200);
    expect(tracking.body.data.order).toMatchObject({
      reference_code: response.body.data.order.reference_code,
      customer_name: 'Budi Santoso',
      order_state: 'submitted',
      total_amount_idr: 30000,
      pickup_info: { address: 'Jl. Pasar', pickup_hours: '08.00-17.00' },
    });
    expect(JSON.stringify(tracking.body)).not.toContain(token);

    const invalidTracking = await request(app).get('/api/v1/guest/orders/gsec_invalid');
    expect(invalidTracking.status).toBe(404);
  });

  it('replays the existing order without reserving inventory again', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', 'checkout-001')
      .send({
        customer_name: 'Budi Santoso',
        whatsapp_number: '081234567890',
        payment_method: 'bank_transfer',
        items: [
          {
            product_id: '00000000-0000-4000-8000-000000000001',
            quantity: 2,
            expected_price_idr: 15000,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.order.reference_code).toBe(createdReferenceCode);
    expect(response.body.data.order.guest_access_token).toBeUndefined();
    const storedOrder = await pool.query(
      'SELECT guest_token_hash FROM orders WHERE idempotency_key = $1',
      ['checkout-001'],
    );
    expect(storedOrder.rows[0].guest_token_hash).toBe(
      createHash('sha256').update(createdGuestToken).digest('hex'),
    );
    const priorTrackingLink = await request(app).get(`/api/v1/guest/orders/${createdGuestToken}`);
    expect(priorTrackingLink.status).toBe(200);
    const inventory = await pool.query(
      'SELECT reserved FROM inventory WHERE product_id = $1',
      ['00000000-0000-4000-8000-000000000001'],
    );
    expect(Number(inventory.rows[0].reserved)).toBe(2);
  });

  it('rejects an idempotency key reused with different item payload', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', 'checkout-001')
      .send({
        customer_name: 'Budi Santoso',
        whatsapp_number: '081234567890',
        payment_method: 'bank_transfer',
        items: [
          {
            product_id: '00000000-0000-4000-8000-000000000001',
            quantity: 1,
            expected_price_idr: 15000,
          },
        ],
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
  });

  it('reports current prices and insufficient stock with actionable product details', async () => {
    const priceChanged = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', 'checkout-price-change')
      .send({
        customer_name: 'Budi Santoso',
        whatsapp_number: '081234567890',
        payment_method: 'pay_at_store',
        items: [
          {
            product_id: '00000000-0000-4000-8000-000000000001',
            quantity: 1,
            expected_price_idr: 14000,
          },
        ],
      });
    expect(priceChanged.status).toBe(409);
    expect(priceChanged.body.error.code).toBe('PRICE_CHANGED');

    const insufficientStock = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', 'checkout-insufficient-stock')
      .send({
        customer_name: 'Budi Santoso',
        whatsapp_number: '081234567890',
        payment_method: 'pay_at_store',
        items: [
          {
            product_id: '00000000-0000-4000-8000-000000000001',
            quantity: 4,
            expected_price_idr: 15000,
          },
        ],
      });
    expect(insufficientStock.status).toBe(422);
    expect(insufficientStock.body.error).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      details: { product_name: 'Beras Rojolele', available_quantity: 3 },
    });
  });

});