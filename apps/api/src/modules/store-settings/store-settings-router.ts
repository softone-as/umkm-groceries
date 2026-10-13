import { Router } from 'express';
import type { Pool } from 'pg';
import { createStoreSettingsController } from './store-settings-controller.js';
import { StoreSettingsRepository } from './store-settings-repository.js';
import { StoreSettingsService } from './store-settings-service.js';

export function createStoreSettingsRouter(database: Pick<Pool, 'query'>): Router {
  const router = Router();
  router.get('/', createStoreSettingsController(new StoreSettingsService(new StoreSettingsRepository(database))));
  return router;
}