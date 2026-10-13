import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import type { Pool } from 'pg';
import { ERROR_CODES } from '@santo/shared';
import { pool as defaultPool } from './db/pool.js';
import { errorHandler } from './middlewares/error-handler.js';
import { requestLogger } from './middlewares/request-logger.js';
import { responseHelpers } from './middlewares/response-helpers.js';
import { createProductRouter } from './modules/products/product-router.js';
import { createStoreSettingsRouter } from './modules/store-settings/store-settings-router.js';

export interface AppOptions {
  pool?: Pick<Pool, 'query'>;
  imageDirectory?: string;
}

/** Reads the comma-separated storefront origin allowlist from the environment. */
function getAllowedOrigins(): string[] {
  return (process.env['CORS_ORIGINS'] ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Creates an API app with injectable database and media roots for tests. */
export function createApp(options: AppOptions = {}): express.Express {
  const app = express();
  const database = options.pool ?? defaultPool;

  app.use(responseHelpers);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: getAllowedOrigins(), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use(
    '/uploads/images',
    express.static(options.imageDirectory ?? resolve(process.cwd(), 'uploads', 'images'), {
      dotfiles: 'deny',
      fallthrough: true,
      maxAge: '1d',
      immutable: true,
      setHeaders: (response) => response.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  const api = express.Router();
  api.use('/products', createProductRouter(database));
  api.use('/store-settings', createStoreSettingsRouter(database));
  app.use('/api/v1', api);

  app.use((_request, response) => {
    response.sendError(ERROR_CODES.NOT_FOUND, 'Rute tidak ditemukan.', undefined, 404);
  });
  app.use(errorHandler);
  return app;
}