export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export const ERROR_CODES = {
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRICE_CHANGED: 'PRICE_CHANGED',
  IDEMPOTENCY_KEY_PAYLOAD_MISMATCH: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
