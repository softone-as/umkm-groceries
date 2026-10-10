export interface StoreSettings {
  readonly id: 1;
  readonly shop_name: string;
  readonly address: string;
  readonly pickup_hours: string;
  readonly whatsapp_number: string;
  readonly bank_instructions: string;
  readonly updated_at: string;
}

export interface PublicStoreSettings {
  readonly shop_name: string;
  readonly address: string;
  readonly pickup_hours: string;
  readonly whatsapp_number: string;
  readonly bank_transfer_instructions: string;
}
