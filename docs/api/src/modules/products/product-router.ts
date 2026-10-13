import { Router } from 'express';
import type { Pool } from 'pg';
import { createProductController } from './product-controller.js';
import { ProductRepository } from './product-repository.js';
import { ProductService } from './product-service.js';

export function createProductRouter(database: Pick<Pool, 'query'>): Router {
  const router = Router();
  router.get('/', createProductController(new ProductService(new ProductRepository(database))));
  return router;
}