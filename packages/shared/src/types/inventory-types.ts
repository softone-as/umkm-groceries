export interface StockBalance {
  readonly onHand: number;
  readonly reserved: number;
}

export interface InventoryRecord {
  readonly product_id: string;
  readonly on_hand: number;
  readonly reserved: number;
  readonly updated_at: string;
}

export type AdjustmentReasonCategory =
  | 'restock'
  | 'damage'
  | 'offline_sale'
  | 'audit_correction'
  | 'other';

export interface InventoryAdjustment {
  readonly id: string;
  readonly product_id: string;
  readonly actor_id: string;
  readonly change_qty: number;
  readonly reason: string;
  readonly created_at: string;
}
