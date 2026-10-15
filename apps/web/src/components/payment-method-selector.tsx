import type { PaymentMethod } from '@santo/shared';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange(value: PaymentMethod): void;
}

const methods: Array<{ value: PaymentMethod; title: string; note: string }> = [
  {
    value: 'bank_transfer',
    title: 'Transfer Bank',
    note: 'Instruksi rekening akan ditampilkan setelah pesanan dibuat.',
  },
  {
    value: 'pay_at_store',
    title: 'Bayar di Toko',
    note: 'Bayar tunai saat mengambil pesanan di toko.',
  },
];

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <fieldset data-testid="payment-method-selector" className="space-y-3">
      <legend className="mb-2 text-headline-sm text-text-primary">Metode pembayaran</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const selected = value === method.value;
          return (
            <label
              key={method.value}
              className={`flex min-h-28 cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors ${
                selected ? 'border-[#16a34a] bg-[#f0fdf4]' : 'border-border-subtle bg-surface hover:border-primary/50'
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={method.value}
                checked={selected}
                onChange={() => onChange(method.value)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>
                <span className="block text-body-md font-bold text-text-primary">{method.title}</span>
                <span className="mt-1 block text-caption leading-5 text-text-muted">{method.note}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}