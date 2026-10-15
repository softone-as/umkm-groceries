import type { RequestHandler } from 'express';
import { OrderService } from './order-service.js';

export function createGuestOrderController(service: OrderService): RequestHandler {
  return async (request, response, next) => {
    try {
      const token = request.params['token'];
      const result = await service.getGuestOrder(typeof token === 'string' ? token : '');
      response.sendSuccess(result);
    } catch (error) {
      next(error);
    }
  };
}