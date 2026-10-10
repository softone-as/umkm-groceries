import { describe, it, expect } from 'vitest';
import {
  createProductSchema,
  createOrderSchema,
  inventoryAdjustmentSchema,
  customerRegisterSchema,
} from '../src/index.js';

describe('createProductSchema', () => {
  it('validates a valid product payload', () => {
    const valid = {
      name: 'Beras Rojolele Super 5kg',
      category: 'Beras',
      selling_unit: 'karung',
      price_idr: 72000,
    };
    const parsed = createProductSchema.parse(valid);
    expect(parsed.name).toBe('Beras Rojolele Super 5kg');
    expect(parsed.price_idr).toBe(72000);
  });

  it('rejects negative or fractional prices', () => {
    expect(() =>
      createProductSchema.parse({
        name: 'Gula',
        category: 'Gula Pasir',
        selling_unit: 'kg',
        price_idr: -5000,
      }),
    ).toThrow();

    expect(() =>
      createProductSchema.parse({
        name: 'Gula',
        category: 'Gula Pasir',
        selling_unit: 'kg',
        price_idr: 12500.5,
      }),
    ).toThrow();
  });
});

describe('createOrderSchema', () => {
  it('validates a valid order submission payload', () => {
    const valid = {
      customer_name: 'Budi Santoso',
      whatsapp_number: '081234567890',
      payment_method: 'bank_transfer',
      items: [
        {
          product_id: 'e7b0a884-18c7-4d92-91e8-78c0e251a31b',
          quantity: 2,
          expected_price_idr: 72000,
        },
      ],
    };
    const parsed = createOrderSchema.parse(valid);
    expect(parsed.whatsapp_number).toBe('6281234567890');
    expect(parsed.items).toHaveLength(1);
  });

  it('rejects order with zero or negative quantity', () => {
    expect(() =>
      createOrderSchema.parse({
        customer_name: 'Budi',
        whatsapp_number: '081234567890',
        payment_method: 'pay_at_store',
        items: [
          {
            product_id: 'e7b0a884-18c7-4d92-91e8-78c0e251a31b',
            quantity: 0,
            expected_price_idr: 72000,
          },
        ],
      }),
    ).toThrow();
  });

  it('rejects invalid Indonesian phone numbers', () => {
    expect(() =>
      createOrderSchema.parse({
        customer_name: 'Budi',
        whatsapp_number: '12345',
        payment_method: 'pay_at_store',
        items: [
          {
            product_id: 'e7b0a884-18c7-4d92-91e8-78c0e251a31b',
            quantity: 1,
            expected_price_idr: 10000,
          },
        ],
      }),
    ).toThrow();
  });
});

describe('inventoryAdjustmentSchema', () => {
  it('accepts valid adjustment delta', () => {
    const parsed = inventoryAdjustmentSchema.parse({
      product_id: 'e7b0a884-18c7-4d92-91e8-78c0e251a31b',
      change_qty: -3,
      reason: 'Kerusakan kemasan',
    });
    expect(parsed.change_qty).toBe(-3);
  });

  it('rejects zero delta change', () => {
    expect(() =>
      inventoryAdjustmentSchema.parse({
        product_id: 'e7b0a884-18c7-4d92-91e8-78c0e251a31b',
        change_qty: 0,
        reason: 'Tidak ada perubahan',
      }),
    ).toThrow();
  });
});

describe('customerRegisterSchema', () => {
  it('validates correct registration data', () => {
    const parsed = customerRegisterSchema.parse({
      name: 'Dewi Lestari',
      email: 'dewi@example.com',
      password: 'password123',
      phone_number: '081298765432',
    });
    expect(parsed.email).toBe('dewi@example.com');
    expect(parsed.phone_number).toBe('6281298765432');
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(() =>
      customerRegisterSchema.parse({
        name: 'Dewi',
        email: 'dewi@example.com',
        password: 'pass',
        phone_number: '081298765432',
      }),
    ).toThrow();
  });
});
