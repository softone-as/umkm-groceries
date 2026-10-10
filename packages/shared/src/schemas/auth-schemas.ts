import { z } from 'zod';
import { sanitizePhoneNumber } from '../utils/sanitize-phone.js';

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150),
  email: z.string().trim().email('Format email tidak valid').max(255),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(100),
  phone_number: z
    .string()
    .trim()
    .min(8, 'Nomor telepon minimal 8 digit')
    .max(30)
    .transform((val) => sanitizePhoneNumber(val))
    .refine((val) => /^628\d{7,13}$/.test(val), {
      message: 'Nomor telepon harus nomor Indonesia yang valid (contoh: 081234567890)',
    }),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const staffLoginSchema = z.object({
  username: z.string().trim().min(3, 'Username minimal 3 karakter').max(50),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(10, 'Token reset password tidak valid'),
  new_password: z.string().min(8, 'Kata sandi baru minimal 8 karakter').max(100),
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
