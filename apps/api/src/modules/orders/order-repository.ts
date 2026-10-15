import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import {
  asIdr,
  addIdr,
  multiplyIdr,
  type CreateOrderInput,
  type GuestOrderTrackingResponse,
  type IdrAmount,
  type OrderCreationResponse,
  type OrderState,
  type PaymentMethod,
  type PaymentState,
} from '@santo/shared';
import { OrderRequestError } from '../../middlewares/error-handler.js';

type DatabasePool = Pick<Pool, 'connect'>;

interface ProductRow extends QueryResultRow {
  id: string;
  name: string;
  selling_unit: string;
  price_idr: string | number;
  is_active: boolean;
}

interface InventoryRow extends QueryResultRow {
  product_id: string;
  on_hand: number;
  reserved: number;
}

interface OrderRow extends QueryResultRow {
  id: string;
  reference_code: string;
  customer_name: string;
  whatsapp_number: string;
  order_state: OrderState;
  payment_state: PaymentState;
  payment_method: PaymentMethod;
  total_amount_idr: string | number;
  payload_hash: string;
  created_at: Date | string;
}

interface OrderItemRow extends QueryResultRow {
  product_id: string;
  name_snapshot: string;
  unit_snapshot: string;
  price_idr_snapshot: string | number;
  quantity: number;
  line_total_idr: string | number;
}

interface StoreRow extends QueryResultRow {
  address: string;
  pickup_hours: string;
  whatsapp_number: string;
  bank_instructions: string;
}

interface StatusHistoryRow extends QueryResultRow {
  from_state: string;
  to_state: string;
  actor_type: string;
  created_at: Date | string;
}

export type CreatedOrder = OrderCreationResponse;

function toIdr(value: number | string): IdrAmount {
  try {
    return asIdr(Number(value));
  } catch {
    throw new OrderRequestError('Nilai Rupiah pesanan melebihi batas aman.', 'INVALID_ORDER_AMOUNT', 422);
  }
}


function hashItems(items: CreateOrderInput['items']): string {
  const normalized = [...items]
    .sort((left, right) => left.product_id.localeCompare(right.product_id))
    .map(({ product_id, quantity, expected_price_idr }) => ({
      product_id,
      quantity,
      expected_price_idr,
    }));
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function assertMatchingPayload(existing: OrderRow, payloadHash: string): void {
  if (existing.payload_hash !== payloadHash) {
    throw new OrderRequestError(
      'Idempotency-Key sudah digunakan untuk isi pesanan yang berbeda.',
      'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
      409,
    );
  }
}

function makeReferenceCode(now: Date): string {
  const month = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `ORD-${month}-${randomBytes(2).toString('hex').toUpperCase()}`;
}

function makeGuestToken(): string {
  return `gsec_${randomBytes(16).toString('hex')}`;
}

function makeWhatsAppUrl(storeNumber: string, order: OrderRow, items: OrderItemRow[]): string {
  const itemLines = items.map(
    (item) => `- ${item.name_snapshot} x${item.quantity}: Rp${Number(item.line_total_idr).toLocaleString('id-ID')}`,
  );
  const message = [
    `Halo, saya ingin konfirmasi pesanan ${order.reference_code}.`,
    `Nama: ${order.customer_name}`,
    ...itemLines,
    `Total: Rp${Number(order.total_amount_idr).toLocaleString('id-ID')}`,
  ].join('\n');
  return `https://wa.me/${storeNumber}?text=${encodeURIComponent(message)}`;
}

function toCreatedOrder(
  order: OrderRow,
  items: OrderItemRow[],
  store: StoreRow,
  guestToken?: string,
): CreatedOrder {
  const result: CreatedOrder = {
    order: {
      id: order.id,
      reference_code: order.reference_code,
      order_state: order.order_state,
      payment_state: order.payment_state,
      payment_method: order.payment_method,
      total_amount_idr: toIdr(order.total_amount_idr),
      whatsapp_url: makeWhatsAppUrl(store.whatsapp_number, order, items),
      items: items.map((item) => ({
        product_id: item.product_id,
        name: item.name_snapshot,
        selling_unit: item.unit_snapshot,
        unit_price_idr: toIdr(item.price_idr_snapshot),
        quantity: item.quantity,
        line_total_idr: toIdr(item.line_total_idr),
      })),
      pickup_info: { address: store.address, pickup_hours: store.pickup_hours },
      ...(order.payment_method === 'bank_transfer'
        ? { bank_transfer_instructions: store.bank_instructions }
        : {}),
      ...(guestToken === undefined
        ? {}
        : {
            guest_access_token: guestToken,
            guest_tracking_url: `/orders/guest?token=${encodeURIComponent(guestToken)}`,
          }),
    },
  };
  return result;
}

export class OrderRepository {
  constructor(private readonly database: DatabasePool) {}

  async create(input: CreateOrderInput, idempotencyKey: string): Promise<{ result: CreatedOrder; replay: boolean }> {
    const client = await this.database.connect();
    const payloadHash = hashItems(input.items);

    try {
      await client.query('BEGIN');
      const existing = await this.findExisting(client, idempotencyKey);
      if (existing) {
        assertMatchingPayload(existing, payloadHash);
        const result = await this.loadExisting(client, existing);
        await client.query('COMMIT');
        return { result, replay: true };
      }

      const requested = new Map<string, { quantity: number; expectedPrice: number }>();
      for (const item of input.items) {
        const previous = requested.get(item.product_id);
        if (previous && previous.expectedPrice !== item.expected_price_idr) {
          throw new OrderRequestError('Harga produk pada keranjang tidak konsisten.', 'PRICE_CHANGED', 409);
        }
        requested.set(item.product_id, {
          quantity: (previous?.quantity ?? 0) + item.quantity,
          expectedPrice: item.expected_price_idr,
        });
      }
      const productIds = [...requested.keys()].sort();

      const inventoryResult = await client.query<InventoryRow>(
        `SELECT product_id, on_hand, reserved
         FROM inventory
         WHERE product_id = ANY($1)
         ORDER BY product_id ASC
         FOR UPDATE`,
        [productIds],
      );

      const committedDuplicate = await this.findExisting(client, idempotencyKey);
      if (committedDuplicate) {
        assertMatchingPayload(committedDuplicate, payloadHash);
        const result = await this.loadExisting(client, committedDuplicate);
        await client.query('COMMIT');
        return { result, replay: true };
      }

      const inventory = new Map(inventoryResult.rows.map((row) => [row.product_id, row]));

      const productResult = await client.query<ProductRow>(
        `SELECT id, name, selling_unit, price_idr, is_active
         FROM products
         WHERE id = ANY($1)
         ORDER BY id ASC`,
        [productIds],
      );
      const products = new Map(productResult.rows.map((row) => [row.id, row]));

      for (const productId of productIds) {
        const product = products.get(productId);
        if (!product || !product.is_active) {
          throw new OrderRequestError('Produk tidak tersedia untuk dipesan.', 'PRODUCT_UNAVAILABLE', 422, {
            product_id: productId,
          });
        }
        const currentPrice = toIdr(product.price_idr);
        if (currentPrice !== requested.get(productId)?.expectedPrice) {
          throw new OrderRequestError('Harga produk telah berubah. Perbarui keranjang Anda.', 'PRICE_CHANGED', 409, {
            product_id: productId,
            current_price_idr: currentPrice,
          });
        }
        const stock = inventory.get(productId);
        const quantity = requested.get(productId)?.quantity ?? 0;
        if (!stock || stock.on_hand - stock.reserved < quantity) {
          throw new OrderRequestError('Stok produk tidak mencukupi. Perbarui keranjang Anda.', 'INSUFFICIENT_STOCK', 422, {
            product_id: productId,
            product_name: product.name,
            requested_quantity: quantity,
            available_quantity: stock ? stock.on_hand - stock.reserved : 0,
          });
        }
      }

      for (const productId of productIds) {
        await client.query(
          'UPDATE inventory SET reserved = reserved + $1, updated_at = NOW() WHERE product_id = $2',
          [requested.get(productId)?.quantity, productId],
        );
      }

      const lineItems = productIds.map((productId) => {
        const product = products.get(productId)!;
        const quantity = requested.get(productId)!.quantity;
        return {
          product_id: productId,
          name_snapshot: product.name,
          unit_snapshot: product.selling_unit,
          price_idr_snapshot: Number(toIdr(product.price_idr)),
          quantity,
          line_total_idr: multiplyIdr(toIdr(product.price_idr), quantity),
        };
      });
      const total = lineItems.reduce((sum, item) => addIdr(sum, toIdr(item.line_total_idr)), asIdr(0));
      const now = new Date();
      const guestToken = makeGuestToken();
      const guestTokenHash = createHash('sha256').update(guestToken).digest('hex');
      const orderId = randomUUID();
      const order = await this.insertOrder(
        client,
        input,
        total,
        idempotencyKey,
        payloadHash,
        guestTokenHash,
        orderId,
        now,
      );

      const savedItems: OrderItemRow[] = [];
      for (const item of lineItems) {
        const savedItem = await client.query<OrderItemRow>(
          `INSERT INTO order_items (
             id, order_id, product_id, name_snapshot, unit_snapshot,
             price_idr_snapshot, quantity, line_total_idr
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING product_id, name_snapshot, unit_snapshot,
                     price_idr_snapshot, quantity, line_total_idr`,
          [
            randomUUID(),
            orderId,
            item.product_id,
            item.name_snapshot,
            item.unit_snapshot,
            item.price_idr_snapshot,
            item.quantity,
            item.line_total_idr,
          ],
        );
        savedItems.push(savedItem.rows[0]!);
      }

      await client.query(
        `INSERT INTO order_status_history (id, order_id, from_state, to_state, actor_type)
         VALUES ($1, $2, 'none', 'submitted', 'customer')`,
        [randomUUID(), orderId],
      );
      const storeResult = await client.query<StoreRow>(
        'SELECT address, pickup_hours, whatsapp_number, bank_instructions FROM store_settings WHERE id = 1',
      );
      if (!storeResult.rows[0]) {
        throw new OrderRequestError('Informasi toko belum tersedia.', 'STORE_SETTINGS_UNAVAILABLE', 503);
      }

      await client.query('COMMIT');
      return { result: toCreatedOrder(order, savedItems, storeResult.rows[0], guestToken), replay: false };
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        const existing = await this.findExisting(client, idempotencyKey);
        if (existing) {
          assertMatchingPayload(existing, payloadHash);
          return { result: await this.loadExisting(client, existing), replay: true };
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async getGuestOrder(token: string): Promise<GuestOrderTrackingResponse> {
    const client = await this.database.connect();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    try {
      const orderResult = await client.query<OrderRow>(
        `SELECT id, reference_code, customer_name, whatsapp_number, order_state,
                payment_state, payment_method, total_amount_idr, payload_hash, created_at
         FROM orders
         WHERE guest_token_hash = $1 AND guest_token_expires_at > NOW()`,
        [tokenHash],
      );
      const order = orderResult.rows[0];
      if (!order) {
        throw new OrderRequestError('Pesanan tidak ditemukan atau tautan telah kedaluwarsa.', 'NOT_FOUND', 404);
      }
      const [itemsResult, historyResult, storeResult] = await Promise.all([
        client.query<OrderItemRow>(
          `SELECT product_id, name_snapshot, unit_snapshot, price_idr_snapshot, quantity, line_total_idr
           FROM order_items WHERE order_id = $1 ORDER BY product_id ASC`,
          [order.id],
        ),
        client.query<StatusHistoryRow>(
          `SELECT from_state, to_state, actor_type, created_at
           FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
          [order.id],
        ),
        client.query<StoreRow>(
          'SELECT address, pickup_hours, whatsapp_number, bank_instructions FROM store_settings WHERE id = 1',
        ),
      ]);
      const store = storeResult.rows[0];
      if (!store) throw new OrderRequestError('Informasi toko belum tersedia.', 'STORE_SETTINGS_UNAVAILABLE', 503);
      return {
        order: {
          reference_code: order.reference_code,
          customer_name: order.customer_name,
          order_state: order.order_state,
          payment_state: order.payment_state,
          payment_method: order.payment_method,
          total_amount_idr: toIdr(order.total_amount_idr),
          items: itemsResult.rows.map((item) => ({
            product_id: item.product_id,
            name: item.name_snapshot,
            selling_unit: item.unit_snapshot,
            unit_price_idr: toIdr(item.price_idr_snapshot),
            quantity: item.quantity,
            line_total_idr: toIdr(item.line_total_idr),
          })),
          status_history: historyResult.rows.map((entry) => ({
            from_state: entry.from_state,
            to_state: entry.to_state,
            actor_type: entry.actor_type,
            created_at: new Date(entry.created_at).toISOString(),
          })),
          pickup_info: { address: store.address, pickup_hours: store.pickup_hours },
        },
      };
    } finally {
      client.release();
    }
  }

  private async insertOrder(
    client: PoolClient,
    input: CreateOrderInput,
    total: IdrAmount,
    idempotencyKey: string,
    payloadHash: string,
    guestTokenHash: string,
    orderId: string,
    now: Date,
  ): Promise<OrderRow> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await client.query<OrderRow>(
        `INSERT INTO orders (
           id, reference_code, guest_token_hash, customer_name, whatsapp_number,
           order_state, payment_state, payment_method, total_amount_idr,
           idempotency_key, payload_hash, guest_token_expires_at
         ) VALUES ($1, $2, $3, $4, $5, 'submitted', 'pending', $6, $7, $8, $9, NOW() + INTERVAL '30 days')
         ON CONFLICT (reference_code) DO NOTHING
         RETURNING id, reference_code, customer_name, whatsapp_number, order_state,
                   payment_state, payment_method, total_amount_idr, payload_hash, created_at`,
        [
          orderId,
          makeReferenceCode(now),
          guestTokenHash,
          input.customer_name,
          input.whatsapp_number,
          input.payment_method,
          total,
          idempotencyKey,
          payloadHash,
        ],
      );
      if (result.rows[0]) return result.rows[0];
    }
    throw new OrderRequestError('Tidak dapat membuat nomor pesanan. Silakan coba kembali.', 'ORDER_REFERENCE_UNAVAILABLE', 503);
  }

  private async findExisting(client: PoolClient, idempotencyKey: string): Promise<OrderRow | undefined> {
    const result = await client.query<OrderRow>(
      `SELECT id, reference_code, customer_name, whatsapp_number, order_state,
              payment_state, payment_method, total_amount_idr, payload_hash, created_at
       FROM orders WHERE idempotency_key = $1`,
      [idempotencyKey],
    );
    return result.rows[0];
  }

  private async loadExisting(client: PoolClient, order: OrderRow): Promise<CreatedOrder> {
    const [itemsResult, storeResult] = await Promise.all([
      client.query<OrderItemRow>(
        `SELECT product_id, name_snapshot, unit_snapshot, price_idr_snapshot, quantity, line_total_idr
         FROM order_items WHERE order_id = $1 ORDER BY product_id ASC`,
        [order.id],
      ),
      client.query<StoreRow>(
        'SELECT address, pickup_hours, whatsapp_number, bank_instructions FROM store_settings WHERE id = 1',
      ),
    ]);
    const store = storeResult.rows[0];
    if (!store) throw new OrderRequestError('Informasi toko belum tersedia.', 'STORE_SETTINGS_UNAVAILABLE', 503);
    return toCreatedOrder(order, itemsResult.rows, store);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}