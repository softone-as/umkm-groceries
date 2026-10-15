import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

const databaseUrl = process.env['TEST_DATABASE_URL'];
const describePostgres = describe.skipIf(!databaseUrl);
const runPrefix = `checkout-race-${randomUUID()}`;
const finalStockProductId = randomUUID();
const firstDeadlockProductId = randomUUID();
const secondDeadlockProductId = randomUUID();

describePostgres('PostgreSQL order checkout concurrency', () => {
  let pool: pg.Pool | undefined;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    const migration = await readFile(resolve(process.cwd(), 'src/db/migrations/001_initial_schema.up.sql'), 'utf8');
    await pool.query(migration);
    await pool.query(
      `INSERT INTO store_settings (id, shop_name, address, pickup_hours, whatsapp_number, bank_instructions)
       VALUES (1, 'Test Store', 'Test Address', '08:00-17:00', '6281234567890', 'BCA 123')
       ON CONFLICT (id) DO NOTHING`,
    );
    await pool.query(
      `INSERT INTO products (id, name, category, selling_unit, price_idr, is_active)
       VALUES
         ($1, 'Race Stock Product', 'Lainnya', 'pcs', 1000, true),
         ($2, 'Deadlock Product A', 'Lainnya', 'pcs', 1000, true),
         ($3, 'Deadlock Product B', 'Lainnya', 'pcs', 1000, true)`,
      [finalStockProductId, firstDeadlockProductId, secondDeadlockProductId],
    );
    await pool.query(
      `INSERT INTO inventory (product_id, on_hand, reserved)
       VALUES ($1, 1, 0), ($2, 10, 0), ($3, 10, 0)`,
      [finalStockProductId, firstDeadlockProductId, secondDeadlockProductId],
    );
    app = createApp({ pool });
  });

  afterAll(async () => {
    if (!pool) return;
    const orderIds = `SELECT id FROM orders WHERE idempotency_key LIKE $1`;
    await pool.query(`DELETE FROM order_status_history WHERE order_id IN (${orderIds})`, [`${runPrefix}%`]);
    await pool.query(`DELETE FROM order_items WHERE order_id IN (${orderIds})`, [`${runPrefix}%`]);
    await pool.query('DELETE FROM orders WHERE idempotency_key LIKE $1', [`${runPrefix}%`]);
    await pool.query('DELETE FROM inventory WHERE product_id = ANY($1::uuid[])', [
      [finalStockProductId, firstDeadlockProductId, secondDeadlockProductId],
    ]);
    await pool.query('DELETE FROM products WHERE id = ANY($1::uuid[])', [
      [finalStockProductId, firstDeadlockProductId, secondDeadlockProductId],
    ]);
    await pool.end();
  });

  it('allows exactly one of five simultaneous orders to reserve the final unit', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        request(app)
          .post('/api/v1/orders')
          .set('Idempotency-Key', `${runPrefix}-stock-${index}`)
          .send({
            customer_name: 'Budi Santoso',
            whatsapp_number: '081234567890',
            payment_method: 'pay_at_store',
            items: [{ product_id: finalStockProductId, quantity: 1, expected_price_idr: 1000 }],
          }),
      ),
    );

    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(
      responses.filter(
        (response) => response.status === 422 && response.body.error.code === 'INSUFFICIENT_STOCK',
      ),
    ).toHaveLength(4);
    const inventory = await pool!.query(
      'SELECT on_hand, reserved FROM inventory WHERE product_id = $1',
      [finalStockProductId],
    );
    expect(inventory.rows[0]).toMatchObject({ on_hand: 1, reserved: 1 });
  }, 30_000);

  it('finishes concurrent checkouts with reversed item order without deadlocks', async () => {
    const productA = { product_id: firstDeadlockProductId, quantity: 2, expected_price_idr: 1000 };
    const productB = { product_id: secondDeadlockProductId, quantity: 2, expected_price_idr: 1000 };
    const responses = await Promise.all([
      request(app)
        .post('/api/v1/orders')
        .set('Idempotency-Key', `${runPrefix}-deadlock-a`)
        .send({
          customer_name: 'Budi Santoso',
          whatsapp_number: '081234567890',
          payment_method: 'pay_at_store',
          items: [productA, productB],
        }),
      request(app)
        .post('/api/v1/orders')
        .set('Idempotency-Key', `${runPrefix}-deadlock-b`)
        .send({
          customer_name: 'Siti Aminah',
          whatsapp_number: '081234567891',
          payment_method: 'pay_at_store',
          items: [productB, productA],
        }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
  }, 30_000);
});