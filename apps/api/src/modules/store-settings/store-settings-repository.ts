import type { Pool, QueryResultRow } from 'pg';

export interface StoreSettingsRow extends QueryResultRow {
  shop_name: string;
  address: string;
  pickup_hours: string;
  whatsapp_number: string;
  bank_transfer_instructions: string;
}

export class StoreSettingsRepository {
  constructor(private readonly database: Pick<Pool, 'query'>) {}

  async getPublicSettings(): Promise<StoreSettingsRow | undefined> {
    const result = await this.database.query<StoreSettingsRow>(
      `SELECT shop_name, address, pickup_hours, whatsapp_number,
              bank_instructions AS bank_transfer_instructions
       FROM store_settings WHERE id = 1`,
    );
    return result.rows[0];
  }
}