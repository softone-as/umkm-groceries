import type { PublicStoreSettings } from '@santo/shared';

interface StoreHeaderProps {
  settings: PublicStoreSettings | undefined;
}

export function StoreHeader({ settings }: StoreHeaderProps) {
  return (
    <header className="border-b border-border-subtle bg-surface" data-testid="store-header">
      <div className="mx-auto w-full max-w-store px-4 sm:px-6">
        <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-border-subtle/70 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-headline-md font-extrabold text-on-primary"
            >
              S
            </span>
            <div className="min-w-0">
              <p className="truncate text-body-lg font-extrabold text-text-primary">Santo Groceries</p>
              <p className="text-caption text-text-muted">Sembako pilihan untuk tetangga</p>
            </div>
          </div>
          <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary-light px-3 text-caption font-bold text-success">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
            Ambil di Toko
          </span>
        </div>
        <div className="flex flex-col gap-1 py-3 text-body-md sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="min-w-0 text-text-body" data-testid="store-pickup-address">
            <span className="font-bold text-text-primary">Alamat toko</span>
            <span aria-hidden="true" className="mx-2 text-border-subtle">·</span>
            {settings?.address ?? 'Memuat alamat toko…'}
          </p>
          <p className="shrink-0 text-caption text-text-muted" data-testid="store-pickup-hours">
            Jam layanan <span className="font-bold text-text-primary">{settings?.pickup_hours ?? '—'}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
