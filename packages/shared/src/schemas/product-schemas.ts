import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Nama produk minimal 2 karakter').max(255),
  category: z.string().trim().min(1, 'Kategori produk wajib diisi').max(100),
  selling_unit: z.string().trim().min(1, 'Satuan jual wajib diisi').max(50),
  price_idr: z
    .number()
    .int('Harga harus berupa bilangan bulat')
    .nonnegative('Harga tidak boleh negatif'),
  image_url: z.string().url().nullable().optional(),
});

export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
