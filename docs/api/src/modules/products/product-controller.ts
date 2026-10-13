import type { RequestHandler } from 'express';
import { ProductService } from './product-service.js';

export function createProductController(service: ProductService): RequestHandler {
  return async (request, response, next) => {
    try {
      const category = typeof request.query['category'] === 'string' ? request.query['category'] : undefined;
      const search = typeof request.query['search'] === 'string' ? request.query['search'] : undefined;
      const products = await service.getProducts({
        ...(category === undefined ? {} : { category }),
        ...(search === undefined ? {} : { search }),
      });
      response.sendSuccess({ products });
    } catch (error) {
      next(error);
    }
  };
}