import { z } from 'zod';
import { sanitizePhoneNumber } from '../utils/sanitize-phone.js';

export const updateStoreSettingsSchema = z.object({
  shop_name: z.string().trim().min(2, 'Nama toko minimal 2 karakter').max(150),
  address: z.string().trim().min(5, 'Alamat toko minimal 5 karakter'),
  pickup_hours: z.string().trim().min(3, 'Jam operasional minimal 3 karakter').max(255),
  whatsapp_number: z
    .string()
    .trim()
    .min(8)
    .max(30)
    .transform((val) => sanitizePhoneNumber(val))
    .refine((val) => /^628\d{7,13}$/.test(val), {
      message: 'Nomor WhatsApp toko harus nomor Indonesia yang valid',
    }),
  bank_instructions: z.string().trim().min(5, 'Instruksi transfer bank minimal 5 karakter'),
});

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
