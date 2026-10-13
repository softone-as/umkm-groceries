import type { RequestHandler } from 'express';
import { StoreSettingsService } from './store-settings-service.js';

export function createStoreSettingsController(service: StoreSettingsService): RequestHandler {
  return async (_request, response, next) => {
    try {
      response.sendSuccess(await service.getPublicSettings());
    } catch (error) {
      next(error);
    }
  };
}