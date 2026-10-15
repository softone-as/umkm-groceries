import { z } from 'zod';
import { sanitizePhoneNumber } from '../utils/sanitize-phone.js';

export const orderItemInputSchema = z.object({
  product_id: z.string().uuid('ID produk tidak valid'),
  quantity: z
    .number()
    .int('Kuantitas harus bilangan bulat')
    .positive('Kuantitas harus minimal 1'),
  expected_price_idr: z
    .number()
    .int('Harga harus bilangan bulat')
    .nonnegative('Harga tidak boleh negatif')
    .refine(Number.isSafeInteger, 'Harga melebihi batas nilai Rupiah yang aman'),
});

export const createOrderSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, 'Nama pemesan minimal 2 karakter')
    .max(150, 'Nama pemesan maksimal 150 karakter'),
  whatsapp_number: z
    .string()
    .trim()
    .min(8, 'Nomor WhatsApp minimal 8 digit')
    .max(30, 'Nomor WhatsApp maksimal 30 karakter')
    .transform((val) => sanitizePhoneNumber(val))
    .refine((val) => /^628\d{7,13}$/.test(val), {
      message: 'Nomor WhatsApp harus nomor Indonesia yang valid (contoh: 081234567890)',
    }),
  payment_method: z.enum(['bank_transfer', 'pay_at_store'], {
    errorMap: () => ({ message: 'Metode pembayaran harus Transfer Bank atau Bayar di Toko' }),
  }),
  items: z
    .array(orderItemInputSchema)
    .min(1, 'Pesanan harus berisi minimal 1 item produk'),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Alasan pembatalan wajib diisi').max(255),
  reason_category: z.enum(['incorrect_stock', 'customer_request', 'abandoned_unpaid', 'other'], {
    errorMap: () => ({ message: 'Kategori alasan pembatalan tidak valid' }),
  }),
  refund_notes: z.string().trim().max(1000).optional(),
  refund_bank_ref: z.string().trim().max(100).optional(),
  refund_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
});

export const updateOrderStatusSchema = z.object({
  state: z.enum(['accepted', 'preparing', 'ready_for_pickup', 'collected'], {
    errorMap: () => ({ message: 'Status tujuan tidak valid' }),
  }),
});

export const updatePaymentStatusSchema = z.object({
  payment_state: z.enum(['confirmed'], {
    errorMap: () => ({ message: 'Status pembayaran hanya dapat diubah ke confirmed' }),
  }),
});

export const claimGuestOrderSchema = z.object({
  guest_access_token: z.string().trim().min(10, 'Token akses guest tidak valid'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type ClaimGuestOrderInput = z.infer<typeof claimGuestOrderSchema>;
