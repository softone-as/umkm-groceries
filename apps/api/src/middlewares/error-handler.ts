import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES } from '@santo/shared';
import { InvalidImageError } from '../services/local-disk-storage-adapter.js';

const CONFLICT_ERROR_CODE = 'CONFLICT';

export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class InsufficientStockError extends Error {}
export class OrderRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

function localizedValidationMessage(issue: ZodError['issues'][number]): string {
  if (issue.code === 'too_small') return 'Nilai yang dikirim terlalu kecil atau belum diisi.';
  if (issue.code === 'too_big') return 'Nilai yang dikirim melebihi batas yang diizinkan.';
  if (issue.code === 'invalid_type') return 'Format data yang dikirim tidak valid.';
  if (issue.code === 'invalid_string' || issue.code === 'invalid_enum_value') {
    return 'Format atau pilihan data yang dikirim tidak valid.';
  }
  return issue.message;
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: localizedValidationMessage(issue),
    }));
    response.sendError(
      ERROR_CODES.VALIDATION_ERROR,
      'Data yang dikirim tidak valid.',
      details,
      422,
    );
    return;
  }

  if (error instanceof NotFoundError) {
    response.sendError(ERROR_CODES.NOT_FOUND, error.message || 'Data tidak ditemukan.', undefined, 404);
    return;
  }

  if (error instanceof ConflictError) {
    response.sendError(
      CONFLICT_ERROR_CODE,
      error.message || 'Permintaan bertentangan dengan data saat ini.',
      undefined,
      409,
    );
    return;
  }

  if (error instanceof InsufficientStockError) {
    response.sendError(ERROR_CODES.INSUFFICIENT_STOCK, error.message || 'Stok tidak mencukupi.', undefined, 422);
    return;
  }

  if (error instanceof OrderRequestError) {
    response.sendError(error.code, error.message, error.details, error.status);
    return;
  }

  if (error instanceof InvalidImageError) {
    response.sendError('INVALID_IMAGE', error.message, undefined, 422);
    return;
  }

  if (error instanceof Error && error.name === 'MulterError') {
    const status = 'code' in error && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    response.sendError('INVALID_UPLOAD', 'File gambar tidak dapat diproses.', undefined, status);
    return;
  }

  response.sendError(ERROR_CODES.INTERNAL_ERROR, 'Terjadi kesalahan pada sistem.', undefined, 500);
};