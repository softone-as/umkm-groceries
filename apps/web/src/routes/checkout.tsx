import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { formatIdr, multiplyIdr, type OrderCreationResponse, type PaymentMethod } from '@santo/shared';
import { useQueryClient } from '@tanstack/react-query';
import { PaymentMethodSelector } from '../components/payment-method-selector';
import { useCart } from '../hooks/use-cart';
import { useStoreSettings } from '../hooks/use-store-settings';
import { ApiError, apiPost } from '../lib/api-client';
import { StoreHeader } from '../components/store-header';

function getIdempotencyKey(fingerprint: string): string {
  const storageKey = 'santo_checkout_idempotency';
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as
      | { fingerprint?: string; key?: string }
      | null;
    if (stored?.fingerprint === fingerprint && stored.key) return stored.key;
    const key = crypto.randomUUID();
    sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }));
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

function getStockErrorName(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || error.code !== 'INSUFFICIENT_STOCK') return undefined;
  if (typeof error.details !== 'object' || error.details === null) return undefined;
  const details = error.details as { product_name?: unknown };
  return typeof details.product_name === 'string' ? details.product_name : undefined;
}

export function CheckoutPage() {
  const { items, subtotalAmountIdr, clearCart } = useCart();
  const settings = useStoreSettings();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stockErrorName, setStockErrorName] = useState<string | undefined>();

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || pending) return;

    const payload = {
      customer_name: customerName.trim(),
      whatsapp_number: whatsappNumber.trim(),
      payment_method: paymentMethod,
      items: items.map(({ id, quantity, price_idr }) => ({
        product_id: id,
        quantity,
        expected_price_idr: price_idr,
      })),
    };
    const idempotencyKey = getIdempotencyKey(JSON.stringify(payload.items));

    setPending(true);
    setErrorMessage(null);
    setStockErrorName(undefined);
    try {
      const confirmation = await apiPost<OrderCreationResponse>('/orders', payload, {
        'Idempotency-Key': idempotencyKey,
      });
      sessionStorage.setItem('santo_last_order', JSON.stringify(confirmation));
      sessionStorage.removeItem('santo_checkout_idempotency');
      clearCart();
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await navigate({ to: '/order-confirmation' });
    } catch (error) {
      setStockErrorName(getStockErrorName(error));
      setErrorMessage(
        error instanceof Error ? error.message : 'Pesanan belum dapat diproses. Silakan coba lagi.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <StoreHeader settings={settings.data} />
      <main className="mx-auto w-full max-w-store px-4 pb-28 pt-6 sm:px-6 sm:pb-12">
        <Link to="/" className="text-body-md font-bold text-primary hover:underline">← Kembali berbelanja</Link>
        <h1 className="mt-3 text-headline-lg-mobile text-text-primary sm:text-headline-lg">Pembayaran</h1>
        {items.length === 0 ? (
          <section className="mt-6 border-y border-border-subtle py-10">
            <h2 className="text-headline-sm text-text-primary">Keranjang masih kosong</h2>
            <p className="mt-2 text-body-md text-text-muted">Tambahkan produk sebelum melanjutkan pembayaran.</p>
            <Link to="/" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-bold text-on-primary">Lihat Produk</Link>
          </section>
        ) : (
          <form onSubmit={submitOrder} className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-7">
              <section className="space-y-4">
                <h2 className="text-headline-sm text-text-primary">Informasi pemesan</h2>
                <label className="block space-y-1.5">
                  <span className="text-body-md font-bold text-text-primary">Nama lengkap</span>
                  <input
                    data-testid="input-customer-name"
                    required
                    minLength={2}
                    maxLength={150}
                    autoComplete="name"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border-subtle bg-surface px-3 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-body-md font-bold text-text-primary">Nomor WhatsApp</span>
                  <input
                    data-testid="input-whatsapp-number"
                    required
                    type="tel"
                    minLength={8}
                    maxLength={30}
                    autoComplete="tel"
                    placeholder="081234567890"
                    value={whatsappNumber}
                    onChange={(event) => setWhatsappNumber(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border-subtle bg-surface px-3 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="block text-caption text-text-muted">Gunakan nomor WhatsApp aktif dengan kode negara Indonesia.</span>
                </label>
              </section>

              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

              {errorMessage && (
                <div role="alert" className="space-y-1 rounded-lg border border-error/30 bg-error-bg p-4 text-body-md text-error">
                  <p className="font-bold">{stockErrorName ? `Stok ${stockErrorName} tidak mencukupi.` : 'Pesanan belum berhasil dibuat.'}</p>
                  <p>{stockErrorName ? 'Perbarui katalog dan sesuaikan keranjang sebelum mencoba kembali.' : errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={pending || items.length === 0}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-body-md font-bold text-on-primary hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {pending && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {pending ? 'Memproses pesanan…' : 'Konfirmasi Pesanan'}
              </button>
            </div>

            <aside className="h-fit space-y-4 border-y border-border-subtle py-5 md:sticky md:top-6">
              <h2 className="text-headline-sm text-text-primary">Ringkasan pesanan</h2>
              <ul className="divide-y divide-border-subtle">
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-3 text-body-md">
                    <span className="min-w-0">{item.name} <span className="text-text-muted">× {item.quantity}</span></span>
                    <span className="shrink-0 font-bold">{formatIdr(multiplyIdr(item.price_idr, item.quantity))}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-border-subtle pt-4 text-body-lg font-extrabold text-text-primary">
                <span>Total</span><span>{formatIdr(subtotalAmountIdr)}</span>
              </div>
            </aside>
          </form>
        )}
      </main>
    </>
  );
}