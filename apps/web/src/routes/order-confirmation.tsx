import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { formatIdr, type OrderCreationResponse } from '@santo/shared';
import { useCart } from '../hooks/use-cart';

function loadConfirmation(): OrderCreationResponse | null {
  try {
    const stored = sessionStorage.getItem('santo_last_order');
    if (!stored) return null;
    const value: unknown = JSON.parse(stored);
    if (typeof value !== 'object' || value === null || !('order' in value)) return null;
    return value as OrderCreationResponse;
  } catch {
    return null;
  }
}

export function OrderConfirmationPage() {
  const confirmation = loadConfirmation();
  const { clearCart } = useCart();
  const [copied, setCopied] = useState(false);
  const order = confirmation?.order;

  useEffect(() => {
    if (order) clearCart();
  }, []);

  async function copyTrackingLink() {
    if (!order?.guest_tracking_url) return;
    const url = new URL(order.guest_tracking_url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!order) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-headline-lg text-text-primary">Pesanan tidak ditemukan</h1>
        <p className="mt-2 text-body-md text-text-muted">Informasi konfirmasi hanya tersedia setelah pesanan berhasil dibuat.</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-bold text-on-primary">Kembali ke toko</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-12 sm:px-6 sm:py-10">
      <section className="border-b border-primary/30 bg-primary-light px-5 py-6 sm:px-7">
        <p className="text-caption font-bold uppercase text-success">Pesanan berhasil</p>
        <h1 className="mt-2 text-headline-lg-mobile text-text-primary sm:text-headline-lg">Terima kasih, pesanan Anda tercatat.</h1>
        <p className="mt-2 text-body-md text-text-body">Nomor referensi</p>
        <p className="mt-1 font-mono text-headline-md font-extrabold text-text-primary" data-testid="order-reference-code">
          {order.reference_code}
        </p>
      </section>

      <section className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="border-y border-border-subtle py-4">
          <h2 className="text-headline-sm text-text-primary">Ambil di toko</h2>
          <p className="mt-2 text-body-md text-text-body">{order.pickup_info.address}</p>
          <p className="mt-2 inline-flex rounded-full bg-secondary-light px-3 py-1.5 text-caption font-bold text-secondary-hover">
            {order.pickup_info.pickup_hours}
          </p>
        </div>
        <div className="border-y border-border-subtle py-4">
          <h2 className="text-headline-sm text-text-primary">Total pembayaran</h2>
          <p className="mt-2 text-price-lg text-text-primary">{formatIdr(order.total_amount_idr)}</p>
          <p className="mt-1 text-caption text-text-muted">
            {order.payment_method === 'bank_transfer' ? 'Transfer Bank' : 'Bayar di Toko'}
          </p>
        </div>
      </section>

      {order.payment_method === 'bank_transfer' && order.bank_transfer_instructions && (
        <section className="mt-5 border border-tertiary/30 bg-tertiary-light p-4 sm:p-5">
          <h2 className="text-headline-sm text-text-primary">Instruksi transfer bank</h2>
          <p className="mt-2 whitespace-pre-wrap text-body-md text-text-body">{order.bank_transfer_instructions}</p>
          <p className="mt-2 text-caption text-text-muted">Cantumkan nomor referensi saat mengirim bukti pembayaran.</p>
        </section>
      )}

      <section className="mt-7">
        <h2 className="text-headline-sm text-text-primary">Rincian produk</h2>
        <ul className="mt-2 divide-y divide-border-subtle border-y border-border-subtle">
          {order.items.map((item) => (
            <li key={item.product_id} className="flex justify-between gap-4 py-3 text-body-md">
              <span className="min-w-0">{item.name} × {item.quantity} <span className="text-caption text-text-muted">({item.selling_unit})</span></span>
              <span className="shrink-0 font-bold">{formatIdr(item.line_total_idr)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4 py-4 text-body-lg font-extrabold text-text-primary">
            <span>Total</span><span>{formatIdr(order.total_amount_idr)}</span>
          </li>
        </ul>
      </section>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <a
          href={order.whatsapp_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-center text-body-md font-bold text-on-primary hover:bg-primary-hover"
        >
          Kirim Bukti / Konfirmasi via WhatsApp
        </a>
        {order.guest_tracking_url && (
          <button
            type="button"
            onClick={() => void copyTrackingLink()}
            className="min-h-12 rounded-lg border border-border-subtle bg-surface px-4 text-body-md font-bold text-text-primary hover:bg-canvas"
          >
            {copied ? 'Tautan pelacakan disalin' : 'Salin tautan pelacakan'}
          </button>
        )}
      </div>
      {order.guest_tracking_url && (
        <p className="mt-2 break-all text-caption text-text-muted" data-testid="guest-tracking-link">
          Tautan pelacakan pribadi tersedia untuk pesanan ini.
        </p>
      )}
      <Link to="/" className="mt-8 inline-flex min-h-11 items-center font-bold text-primary hover:underline">Kembali ke katalog</Link>
    </main>
  );
}