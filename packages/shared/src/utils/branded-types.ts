export type IdrAmount = number & { readonly __brand: unique symbol };

/**
 * Validates and casts an integer number into a branded non-negative IdrAmount.
 * @param value Non-negative integer Rupiah value.
 * @throws TypeError if value is not a non-negative integer.
 */
export function asIdr(value: number): IdrAmount {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`IDR amount must be a non-negative integer: ${value}`);
  }
  return value as IdrAmount;
}
