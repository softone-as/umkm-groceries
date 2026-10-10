/**
 * Formats an integer amount into standardized Indonesian Rupiah currency string.
 * @param amount Integer Rupiah value (no decimals).
 * @returns Formatted currency string, e.g., "Rp 15.000" or "Rp 72.000".
 */
export function formatIdr(amount: number): string {
  if (!Number.isFinite(amount)) {
    return 'Rp 0';
  }

  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);

  // Normalizes non-breaking spaces if any from Intl formatting
  return formatted.replace(/\s+/g, ' ');
}
