import { formatIdr } from '@santo/shared';
import { useCart } from '../hooks/use-cart';

export function CartDock({ onOpen }: { onOpen(): void }) {
  const { totalItemsCount, subtotalAmountIdr } = useCart();
  if (totalItemsCount === 0) return null;

  return (
    <aside
      data-testid="cart-dock"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] inset-x-0 z-30 mx-auto flex w-full max-w-[640px] items-center justify-between gap-3 border-t border-border-subtle bg-surface px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[360px] sm:rounded-lg sm:border"
    >
      <div className="min-w-0">
        <p className="truncate text-caption text-text-muted">{totalItemsCount} item di keranjang</p>
        <p className="truncate text-price-md text-text-primary">{formatIdr(subtotalAmountIdr)}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="min-h-11 shrink-0 rounded-lg bg-primary px-4 text-body-md font-bold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Lihat Keranjang
      </button>
    </aside>
  );
}