export type IdrAmount = number & { readonly __brand: unique symbol };

/**
 * Validates and casts a safely representable integer into a branded non-negative IdrAmount.
 * @param value Non-negative integer Rupiah value.
 * @throws TypeError if value is not a non-negative integer.
 */
export function asIdr(value: number): IdrAmount {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`IDR amount must be a non-negative integer: ${value}`);
  }
  return value as IdrAmount;
}

export function multiplyIdr(amount: number, quantity: number): IdrAmount {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new TypeError(`Quantity must be a non-negative safe integer: ${quantity}`);
  }
  return asIdr(amount * quantity);
}

export function addIdr(left: number, right: number): IdrAmount {
  return asIdr(left + right);
}
