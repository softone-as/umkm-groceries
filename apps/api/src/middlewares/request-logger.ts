import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const sensitiveKey = /password|guest_access_token|token|session_cookie/i;
const phoneKey = /phone|whatsapp/i;
const phoneLikeValue = /\+?\d[\d\s().-]{7,}\d/g;

/** Masks a phone number while preserving a short international prefix and final digits. */
export function maskPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  const international = digits.startsWith('0')
    ? `+62${digits.slice(1)}`
    : digits.startsWith('62')
      ? `+${digits}`
      : value.startsWith('+')
        ? `+${digits}`
        : digits;

  if (digits.length < 9 || digits.length > 15) return '[REDACTED_PHONE]';
  const visiblePrefix = international.startsWith('+62') ? international.slice(0, 6) : international.slice(0, 4);
  return `${visiblePrefix}${'*'.repeat(Math.max(4, international.length - visiblePrefix.length - 4))}${international.slice(-4)}`;
}

/** Recursively masks phone numbers and replaces values for secret-bearing keys. */
export function sanitizeLogValue(value: unknown, key = ''): unknown {
  if (sensitiveKey.test(key)) return '[REDACTED]';
  if (typeof value === 'string') {
    if (phoneKey.test(key)) return maskPhoneNumber(value);
    return value.replace(phoneLikeValue, (candidate) => {
      const digits = candidate.replace(/\D/g, '');
      return digits.length >= 9 && digits.length <= 15 ? maskPhoneNumber(candidate) : candidate;
    });
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeLogValue(item));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, sanitizeLogValue(childValue, childKey)]),
    );
  }
  return value;
}

export const requestLogger: RequestHandler = (request, response, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  response.setHeader('x-request-id', requestId);
  response.on('finish', () => {
    console.info(
      JSON.stringify({
        request_id: requestId,
        method: request.method,
        path: request.route ? `${request.baseUrl}${request.route.path}` : '[unmatched]',
        query: sanitizeLogValue(request.query),
        body: sanitizeLogValue(request.body),
        status: response.statusCode,
        duration_ms: Date.now() - startedAt,
      }),
    );
  });
  next();
};