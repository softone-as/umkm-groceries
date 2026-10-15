import { describe, it, expect } from 'vitest';
import {
  formatIdr,
  calculateAvailableStock,
  asIdr,
  addIdr,
  multiplyIdr,
  sanitizePhoneNumber,
  maskPhoneNumber,
} from '../src/index.js';

describe('formatIdr', () => {
  it('formats regular amounts correctly without decimal places', () => {
    const formatted = formatIdr(15000);
    expect(formatted).toMatch(/Rp\s?15\.000/);
  });

  it('formats 0 IDR correctly', () => {
    const formatted = formatIdr(0);
    expect(formatted).toMatch(/Rp\s?0/);
  });

  it('handles negative or invalid numbers gracefully', () => {
    expect(formatIdr(NaN)).toBe('Rp 0');
    expect(formatIdr(Infinity)).toBe('Rp 0');
  });

  it('formats large numbers without decimals', () => {
    const formatted = formatIdr(1250000);
    expect(formatted).toMatch(/Rp\s?1\.250\.000/);
  });
});

describe('calculateAvailableStock', () => {
  it('calculates available stock as onHand - reserved', () => {
    expect(calculateAvailableStock({ onHand: 10, reserved: 3 })).toBe(7);
  });

  it('returns 0 when reserved equals onHand', () => {
    expect(calculateAvailableStock({ onHand: 5, reserved: 5 })).toBe(0);
  });

  it('returns 0 and does not return negative if reserved exceeds onHand', () => {
    expect(calculateAvailableStock({ onHand: 2, reserved: 5 })).toBe(0);
  });

  it('handles edge cases with missing/invalid integers safely', () => {
    expect(calculateAvailableStock({ onHand: 0, reserved: 0 })).toBe(0);
  });
});

describe('asIdr', () => {
  it('returns branded IdrAmount for valid non-negative integer', () => {
    const amount = asIdr(50000);
    expect(amount).toBe(50000);
  });

  it('throws TypeError for non-integer numbers', () => {
    expect(() => asIdr(50.5)).toThrowError(TypeError);
  });

  it('throws TypeError for negative numbers', () => {
    expect(() => asIdr(-100)).toThrowError(TypeError);
  });

  it('rejects integers outside JavaScript safe precision', () => {
    expect(() => asIdr(Number.MAX_SAFE_INTEGER + 1)).toThrowError(TypeError);
  });

    it('multiplies and adds whole Rupiah amounts without losing safe precision', () => {
      expect(multiplyIdr(15000, 2)).toBe(30000);
      expect(addIdr(30000, 12000)).toBe(42000);
      expect(() => multiplyIdr(Number.MAX_SAFE_INTEGER, 2)).toThrowError(TypeError);
      expect(() => addIdr(Number.MAX_SAFE_INTEGER, 1)).toThrowError(TypeError);
    });
});

describe('sanitizePhoneNumber & maskPhoneNumber', () => {
  it('converts Indonesian 08xx number to 628xx format', () => {
    expect(sanitizePhoneNumber('081234567890')).toBe('6281234567890');
    expect(sanitizePhoneNumber('0812-3456-7890')).toBe('6281234567890');
    expect(sanitizePhoneNumber('+62 812 3456 7890')).toBe('6281234567890');
  });

  it('masks phone numbers properly for logging privacy', () => {
    const masked = maskPhoneNumber('081234567890');
    expect(masked).toBe('+62812****7890');
  });
});
