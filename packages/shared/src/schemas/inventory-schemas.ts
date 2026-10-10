import { z } from 'zod';

export const inventoryAdjustmentSchema = z.object({
  product_id: z.string().uuid('ID produk tidak valid'),
  change_qty: z
    .number()
    .int('Jumlah perubahan stok harus berupa bilangan bulat')
    .refine((val) => val !== 0, {
      message: 'Perubahan stok tidak boleh 0',
    }),
  reason: z
    .string()
    .trim()
    .min(3, 'Alasan penyesuaian stok minimal 3 karakter')
    .max(255, 'Alasan penyesuaian stok maksimal 255 karakter'),
});

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
