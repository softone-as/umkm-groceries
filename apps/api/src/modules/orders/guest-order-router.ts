import { Router } from 'express';
import type { Pool } from 'pg';
import { createGuestOrderController } from './guest-order-controller.js';
import { OrderRepository } from './order-repository.js';
import { OrderService } from './order-service.js';

export function createGuestOrderRouter(database: Pick<Pool, 'connect'>): Router {
  const router = Router();
  const service = new OrderService(new OrderRepository(database));
  router.get('/orders/:token', createGuestOrderController(service));
  return router;
}