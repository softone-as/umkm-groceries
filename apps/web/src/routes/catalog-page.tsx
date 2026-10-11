import { useState } from 'react';
import { CategoryFilter } from '../components/category-filter';
import { ProductGrid } from '../components/product-grid';
import { ProductGridSkeleton } from '../components/product-grid-skeleton';
import { SearchBar } from '../components/search-bar';
import { StoreHeader } from '../components/store-header';
import { useProducts } from '../hooks/use-products';
import { useStoreSettings } from '../hooks/use-store-settings';

export function CatalogPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const settings = useStoreSettings();
  const products = useProducts(category, search);

  return (
    <>
      <StoreHeader settings={settings.data} />
      <main className="mx-auto w-full max-w-store space-y-4 px-4 py-4 sm:px-6">
        <SearchBar onSearch={setSearch} />
        <CategoryFilter value={category} onChange={setCategory} />

        {products.isError && !products.data ? (
          <div
            role="alert"
            data-testid="catalog-error"
            className="flex flex-col items-start gap-3 rounded-xl bg-error-bg p-4 text-error"
          >
            <p className="text-body-lg">Gagal memuat produk. Silakan coba lagi.</p>
            <button
              type="button"
              onClick={() => void products.refetch()}
              className="h-11 min-w-11 rounded-lg bg-error px-4 text-body-md font-bold text-on-primary"
            >
              Muat Ulang
            </button>
          </div>
        ) : products.isPending ? (
          <ProductGridSkeleton />
        ) : products.data.length === 0 ? (
          <p data-testid="catalog-empty" className="py-12 text-center text-body-lg text-text-muted">
            Tidak ada produk yang sesuai dengan pencarian Anda
          </p>
        ) : (
          <ProductGrid products={products.data} />
        )}
      </main>
    </>
  );
}
