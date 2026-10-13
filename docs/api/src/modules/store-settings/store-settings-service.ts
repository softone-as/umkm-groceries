import type { PublicStoreSettings } from '@santo/shared';
import { NotFoundError } from '../../middlewares/error-handler.js';
import { StoreSettingsRepository } from './store-settings-repository.js';

export class StoreSettingsService {
  constructor(private readonly repository: StoreSettingsRepository) {}

  async getPublicSettings(): Promise<PublicStoreSettings> {
    const settings = await this.repository.getPublicSettings();
    if (!settings) throw new NotFoundError('Informasi toko tidak ditemukan.');
    return settings;
  }
}