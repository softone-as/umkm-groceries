import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { formatIdr, type GuestOrderTrackingResponse, type OrderState } from '@santo/shared';
import { apiGet } from '../lib/api-client';

const stateLabels: Record<OrderState, string> = {
  submitted: 'Pesanan diterima',
  accepted: 'Pesanan dikonfirmasi toko',
  preparing: 'Pesanan sedang disiapkan',
  ready_for_pickup: 'Pesanan siap diambil',
  collected: 'Pesanan telah diambil',
  cancelled: 'Pesanan dibatalkan',
};

export function GuestOrderPage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const orderQuery = useQuery({
    queryKey: ['guest-order', token],
    enabled: token.length > 0,
    retry: false,
    queryFn: () => apiGet<GuestOrderTrackingResponse>(`/guest/orders/${encodeURIComponent(token)}`),
  });
  const order = orderQuery.data?.order;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {!token ? (
        <section role="alert" className="border-y border-error/30 py-6 text-error">
          <h1 className="text-headline-md">Tautan pelacakan tidak valid</h1>
          <p className="mt-2 text-body-md">Gunakan tautan pelacakan pribadi dari konfirmasi pesanan Anda.</p>
        </section>
      ) : orderQuery.isPending ? (
        <p role="status" className="py-10 text-body-md text-text-muted">Memuat status pesanan…</p>
      ) : orderQuery.isError || !order ? (
        <section role="alert" className="border-y border-error/30 py-6 text-error">
          <h1 className="text-headline-md">Pesanan tidak ditemukan</h1>
          <p className="mt-2 text-body-md">Tautan mungkin tidak valid atau sudah kedaluwarsa.</p>
        </section>
      ) : (
        <>
          <p className="text-caption font-bold uppercase text-success">Pelacakan pesanan</p>
          <h1 className="mt-2 text-headline-lg-mobile text-text-primary sm:text-headline-lg">
            {order.reference_code}
          </h1>
          <section className="mt-5 border-y border-primary/30 bg-primary-light p-5">
            <p className="text-caption text-text-muted">Status terkini</p>
            <p data-testid="guest-order-state" className="mt-1 text-headline-md text-text-primary">
              {stateLabels[order.order_state]}
            </p>
            <p className="mt-2 text-body-md text-text-body">Pemesan: {order.customer_name}</p>
          </section>

          <section className="mt-7">
            <h2 className="text-headline-sm text-text-primary">Rincian pesanan</h2>
            <ul className="mt-2 divide-y divide-border-subtle border-y border-border-subtle">
              {order.items.map((item) => (
                <li key={item.product_id} className="flex justify-between gap-4 py-3 text-body-md">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="shrink-0 font-bold">{formatIdr(item.line_total_idr)}</span>
                </li>
              ))}
              <li className="flex justify-between py-4 text-body-lg font-extrabold text-text-primary">
                <span>Total</span><span>{formatIdr(order.total_amount_idr)}</span>
              </li>
            </ul>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="text-headline-sm text-text-primary">Ambil di toko</h2>
              <p className="mt-2 text-body-md">{order.pickup_info.address}</p>
              <p className="mt-1 text-caption text-text-muted">{order.pickup_info.pickup_hours}</p>
            </div>
            <div>
              <h2 className="text-headline-sm text-text-primary">Riwayat status</h2>
              <ol className="mt-2 space-y-2">
                {order.status_history.map((entry, index) => (
                  <li key={`${entry.to_state}-${entry.created_at}-${index}`} className="text-body-md text-text-body">
                    <span className="font-bold">{stateLabels[entry.to_state as OrderState] ?? entry.to_state}</span>
                    <time className="ml-2 text-caption text-text-muted">
                      {new Date(entry.created_at).toLocaleString('id-ID')}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </>
      )}
      <Link to="/" className="mt-8 inline-flex min-h-11 items-center font-bold text-primary hover:underline">Kembali ke katalog</Link>
    </main>
  );
}