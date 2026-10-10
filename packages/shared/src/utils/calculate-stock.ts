import type { StockBalance } from '../types/inventory-types.js';

/**
 * Calculates available stock ready for customer purchase.
 * @param balance Object containing physical onHand and active reserved quantities.
 * @returns Non-negative integer available quantity.
 */
export function calculateAvailableStock(balance: StockBalance): number {
  const onHand = Number.isInteger(balance.onHand) ? balance.onHand : 0;
  const reserved = Number.isInteger(balance.reserved) ? balance.reserved : 0;

  const available = onHand - reserved;
  return Math.max(0, available);
}
