import { Link } from '@tanstack/react-router';
import { formatIdr, multiplyIdr } from '@santo/shared';
import { useCart } from '../hooks/use-cart';
import { QuantityStepper } from './quantity-stepper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose(): void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, subtotalAmountIdr, updateQuantity, removeItem } = useCart();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-text-primary/40" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        data-testid="cart-drawer"
        className="cart-drawer-panel flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 id="cart-drawer-title" className="text-headline-md text-text-primary">Keranjang Belanja</h2>
            <p className="mt-1 text-caption text-text-muted">{items.length} jenis produk</p>
          </div>
          <button
            type="button"
            aria-label="Tutup keranjang"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-headline-md text-text-muted hover:bg-canvas"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="py-12 text-center text-body-md text-text-muted">Keranjang Anda masih kosong.</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="flex gap-3 border-b border-border-subtle pb-4">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary" aria-hidden="true">
                    S
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-body-md font-bold text-text-primary">{item.name}</h3>
                  <p className="mt-1 text-caption text-text-muted">{formatIdr(item.price_idr)} / {item.selling_unit}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QuantityStepper
                      quantity={item.quantity}
                      onChange={(quantity) => updateQuantity(item.id, quantity)}
                      onRemove={() => removeItem(item.id)}
                    />
                    <p className="shrink-0 text-body-md font-bold text-text-primary">
                      {formatIdr(multiplyIdr(item.price_idr, item.quantity))}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <footer className="space-y-3 border-t border-border-subtle p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="flex justify-between text-body-md text-text-muted">
            <span>Subtotal</span>
            <span>{formatIdr(subtotalAmountIdr)}</span>
          </div>
          <div className="flex justify-between text-body-lg font-extrabold text-text-primary">
            <span>Total</span>
            <span>{formatIdr(subtotalAmountIdr)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={onClose}
            className={`flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-body-md font-bold text-on-primary hover:bg-primary-hover ${items.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={items.length === 0}
          >
            Lanjut ke Pembayaran
          </Link>
        </footer>
      </section>
    </div>
  );
}