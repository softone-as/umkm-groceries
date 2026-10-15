import { createOrderSchema, type CreateOrderInput } from '@santo/shared';
import { OrderRequestError } from '../../middlewares/error-handler.js';
import { OrderRepository } from './order-repository.js';

export class OrderService {
  constructor(private readonly repository: OrderRepository) {}

  async create(input: CreateOrderInput, idempotencyKey: string) {
    return this.repository.create(createOrderSchema.parse(input), idempotencyKey);
  }

  async getGuestOrder(token: string) {
    if (!/^gsec_[a-f0-9]{32}$/.test(token)) {
      throw new OrderRequestError('Pesanan tidak ditemukan atau tautan telah kedaluwarsa.', 'NOT_FOUND', 404);
    }
    return this.repository.getGuestOrder(token);
  }

  validateInput(input: unknown): CreateOrderInput {
    return createOrderSchema.parse(input);
  }

  validateIdempotencyKey(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0 || value.length > 128) {
      throw new OrderRequestError('Header Idempotency-Key wajib diisi.', 'IDEMPOTENCY_KEY_REQUIRED', 400);
    }
    return value.trim();
  }
}