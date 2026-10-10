import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../src/db/pool.js';
import { runMigrationsUp } from '../src/db/migrate.js';

describe('PostgreSQL Database Schema & Constraints Integrity', () => {
  beforeAll(async () => {
    await runMigrationsUp();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('verifies that products table accepts valid product and rejects negative price', async () => {
    const client = await pool.connect();
    try {
      // Valid product insertion
      const validRes = await client.query<{ id: string }>(
        `INSERT INTO products (name, category, selling_unit, price_idr)
         VALUES ('Test Product Beras', 'Beras', 'kg', 15000)
         RETURNING id`,
      );
      expect(validRes.rows[0]?.id).toBeDefined();

      // Negative price should violate CHECK (price_idr >= 0)
      await expect(
        client.query(
          `INSERT INTO products (name, category, selling_unit, price_idr)
           VALUES ('Invalid Price Product', 'Beras', 'kg', -100)`,
        ),
      ).rejects.toThrow();
    } finally {
      client.release();
    }
  });

  it('enforces chk_on_hand_ge_reserved constraint when on_hand < reserved', async () => {
    const client = await pool.connect();
    try {
      const prodRes = await client.query<{ id: string }>(
        `INSERT INTO products (name, category, selling_unit, price_idr)
         VALUES ('Stock Constraint Test Product', 'Minyak', 'liter', 20000)
         RETURNING id`,
      );
      const productId = prodRes.rows[0]!.id;

      // Valid: on_hand = 10, reserved = 3 (10 >= 3)
      await client.query(
        `INSERT INTO inventory (product_id, on_hand, reserved) VALUES ($1, 10, 3)`,
        [productId],
      );

      // Invalid: on_hand = 2, reserved = 5 (2 < 5) violates constraint
      await expect(
        client.query(
          `UPDATE inventory SET on_hand = 2, reserved = 5 WHERE product_id = $1`,
          [productId],
        ),
      ).rejects.toThrow(/chk_on_hand_ge_reserved/);
    } finally {
      client.release();
    }
  });

  it('enforces singleton constraint on store_settings (id = 1)', async () => {
    const client = await pool.connect();
    try {
      // Attempting to insert id = 2 must fail CHECK (id = 1)
      await expect(
        client.query(`
          INSERT INTO store_settings (
            id, shop_name, address, pickup_hours, whatsapp_number, bank_instructions
          ) VALUES (
            2, 'Second Store', 'Address 2', 'Hours', '62811111111', 'BCA'
          );
        `),
      ).rejects.toThrow();
    } finally {
      client.release();
    }
  });

  it('enforces order_items quantity > 0 check constraint', async () => {
    const client = await pool.connect();
    try {
      const prod = await client.query<{ id: string }>(
        `INSERT INTO products (name, category, selling_unit, price_idr)
         VALUES ('Item Quantity Test Product', 'Gula', 'kg', 17000)
         RETURNING id`,
      );
      const productId = prod.rows[0]!.id;

      const orderRes = await client.query<{ id: string }>(
        `INSERT INTO orders (
          reference_code, customer_name, whatsapp_number, order_state,
          payment_state, payment_method, total_amount_idr, idempotency_key, payload_hash
        ) VALUES (
          'ORD-TEST-QTY', 'Test Customer', '6281234567890', 'submitted',
          'pending', 'pay_at_store', 17000, 'idem-key-qty-test', 'hash123'
        ) RETURNING id`,
      );
      const orderId = orderRes.rows[0]!.id;

      // Inserting quantity = 0 must fail
      await expect(
        client.query(
          `INSERT INTO order_items (
            order_id, product_id, name_snapshot, unit_snapshot, price_idr_snapshot, quantity, line_total_idr
          ) VALUES ($1, $2, 'Snap', 'kg', 17000, 0, 0)`,
          [orderId, productId],
        ),
      ).rejects.toThrow();
    } finally {
      client.release();
    }
  });
});
