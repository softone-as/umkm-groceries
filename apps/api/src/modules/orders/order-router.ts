import { Router } from 'express';
import type { Pool } from 'pg';
import { createOrderController } from './order-controller.js';
import { OrderRepository } from './order-repository.js';
import { OrderService } from './order-service.js';

export function createOrderRouter(database: Pick<Pool, 'connect'>): Router {
  const router = Router();
  router.post('/', createOrderController(new OrderService(new OrderRepository(database))));
  return router;
}