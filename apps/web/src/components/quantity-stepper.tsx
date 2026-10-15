interface QuantityStepperProps {
  quantity: number;
  onChange(quantity: number): void;
  onRemove(): void;
}

export function QuantityStepper({ quantity, onChange, onRemove }: QuantityStepperProps) {
  return (
    <div data-testid="quantity-stepper" className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label={quantity === 1 ? 'Hapus item' : 'Kurangi jumlah'}
        onClick={() => (quantity === 1 ? onRemove() : onChange(quantity - 1))}
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-headline-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          quantity === 1
            ? 'border-error/30 text-error hover:bg-error-bg'
            : 'border-border-subtle bg-surface text-text-primary hover:bg-canvas'
        }`}
      >
        <span aria-hidden="true">{quantity === 1 ? '🗑︎' : '−'}</span>
      </button>
      <span aria-live="polite" className="min-w-6 text-center text-body-md font-bold text-text-primary">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        onClick={() => onChange(quantity + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface text-headline-sm font-bold text-text-primary transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}