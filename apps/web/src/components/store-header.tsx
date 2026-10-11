import type { PublicStoreSettings } from '@santo/shared';

interface StoreHeaderProps {
  settings: PublicStoreSettings | undefined;
}

export function StoreHeader({ settings }: StoreHeaderProps) {
  return (
    <header className="bg-primary text-on-primary" data-testid="store-header">
      <div className="mx-auto flex w-full max-w-store flex-col gap-1 px-4 py-4 sm:px-6">
        <h1 className="text-headline-lg-mobile sm:text-headline-lg">Santo Groceries</h1>
        <p className="text-body-md" data-testid="store-pickup-address">
          {settings?.address ?? 'Memuat alamat toko…'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary-light px-3 py-1 text-caption text-text-primary">
            Ambil di Toko
          </span>
          <span className="text-caption" data-testid="store-pickup-hours">
            {settings?.pickup_hours ?? ''}
          </span>
        </div>
      </div>
    </header>
  );
}
