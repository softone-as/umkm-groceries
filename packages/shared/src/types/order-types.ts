import type { IdrAmount } from '../utils/branded-types.js';

export type OrderState =
  | 'submitted'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'collected'
  | 'cancelled';

export type PaymentState = 'pending' | 'confirmed';

export type PaymentMethod = 'bank_transfer' | 'pay_at_store';

export type CancellationReasonCategory =
  | 'incorrect_stock'
  | 'customer_request'
  | 'abandoned_unpaid'
  | 'other';

export interface OrderItemSnapshot {
  readonly id: string;
  readonly order_id: string;
  readonly product_id: string;
  readonly name_snapshot: string;
  readonly unit_snapshot: string;
  readonly price_idr_snapshot: number;
  readonly quantity: number;
  readonly line_total_idr: number;
}

export interface OrderStatusHistoryEntry {
  readonly id: string;
  readonly order_id: string;
  readonly from_state: string;
  readonly to_state: string;
  readonly actor_type: 'customer' | 'staff' | 'system';
  readonly actor_id?: string | null | undefined;
  readonly notes?: string | null | undefined;
  readonly created_at: string;
}

export interface Order {
  readonly id: string;
  readonly reference_code: string;
  readonly guest_token_hash?: string | null | undefined;
  readonly customer_id?: string | null | undefined;
  readonly customer_name: string;
  readonly whatsapp_number: string;
  readonly order_state: OrderState;
  readonly payment_state: PaymentState;
  readonly payment_method: PaymentMethod;
  readonly total_amount_idr: number;
  readonly idempotency_key: string;
  readonly payload_hash: string;
  readonly cancellation_reason?: string | null | undefined;
  readonly refund_notes?: string | null | undefined;
  readonly refund_bank_ref?: string | null | undefined;
  readonly refund_date?: string | null | undefined;
  readonly guest_token_expires_at?: string | null | undefined;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface OrderWithDetails extends Order {
  readonly items: readonly OrderItemSnapshot[];
  readonly status_history?: readonly OrderStatusHistoryEntry[] | undefined;
  readonly whatsapp_url?: string | undefined;
  readonly guest_access_token?: string | undefined;
  readonly guest_tracking_url?: string | undefined;
  readonly pickup_info?: {
    readonly address: string;
    readonly pickup_hours: string;
  } | undefined;
}

export interface OrderCreationResponse {
  readonly order: {
    readonly id: string;
    readonly reference_code: string;
    readonly order_state: OrderState;
    readonly payment_state: PaymentState;
    readonly payment_method: PaymentMethod;
    readonly total_amount_idr: IdrAmount;
    readonly whatsapp_url: string;
    readonly guest_access_token?: string;
    readonly guest_tracking_url?: string;
    readonly items: readonly {
      readonly product_id: string;
      readonly name: string;
      readonly selling_unit: string;
      readonly unit_price_idr: IdrAmount;
      readonly quantity: number;
      readonly line_total_idr: IdrAmount;
    }[];
    readonly pickup_info: {
      readonly address: string;
      readonly pickup_hours: string;
    };
    readonly bank_transfer_instructions?: string;
  };
}

export interface GuestOrderTrackingResponse {
  readonly order: {
    readonly reference_code: string;
    readonly customer_name: string;
    readonly order_state: OrderState;
    readonly payment_state: PaymentState;
    readonly payment_method: PaymentMethod;
    readonly total_amount_idr: IdrAmount;
    readonly items: readonly {
      readonly product_id: string;
      readonly name: string;
      readonly selling_unit: string;
      readonly unit_price_idr: IdrAmount;
      readonly quantity: number;
      readonly line_total_idr: IdrAmount;
    }[];
    readonly status_history: readonly {
      readonly from_state: string;
      readonly to_state: string;
      readonly actor_type: string;
      readonly created_at: string;
    }[];
    readonly pickup_info: {
      readonly address: string;
      readonly pickup_hours: string;
    };
  };
}
