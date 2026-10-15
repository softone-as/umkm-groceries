import type { RequestHandler } from 'express';
import { OrderService } from './order-service.js';

export function createOrderController(service: OrderService): RequestHandler {
  return async (request, response, next) => {
    try {
      const input = service.validateInput(request.body);
      const idempotencyKey = service.validateIdempotencyKey(request.header('Idempotency-Key'));
      const { result, replay } = await service.create(input, idempotencyKey);
      response.status(replay ? 200 : 201).sendSuccess(result);
    } catch (error) {
      next(error);
    }
  };
}