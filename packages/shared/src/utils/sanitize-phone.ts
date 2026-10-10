/**
 * Standardizes an Indonesian phone number into the national/E.164-compatible standard (e.g. "6281234567890").
 * Strips whitespace, hyphens, parentheses, and converts leading "08..." or "+628..." into "628...".
 * @param phone Raw phone number string.
 * @returns Sanitized phone string.
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) {
    return '';
  }

  // Remove non-digit characters except leading plus if present
  let cleaned = phone.trim().replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Masks a phone number for privacy-compliant logging (e.g. "+62812****7890").
 * @param phone Sanitized or raw phone string.
 * @returns Masked phone string.
 */
export function maskPhoneNumber(phone: string): string {
  const sanitized = sanitizePhoneNumber(phone);
  if (sanitized.length <= 6) {
    return '***';
  }

  const prefix = '+' + sanitized.slice(0, 5);
  const suffix = sanitized.slice(-4);
  return `${prefix}****${suffix}`;
}
