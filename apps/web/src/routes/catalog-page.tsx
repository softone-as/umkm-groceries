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
  const allProducts = useProducts(undefined, '');
  const products = useProducts(category, search);
  const categoryCounts = allProducts.data?.reduce<Record<string, number>>((counts, product) => {
    counts[product.category] = (counts[product.category] ?? 0) + 1;
    return counts;
  }, {});
  const availableCount = products.data?.filter((product) => product.is_available).length ?? 0;

  return (
    <>
      <StoreHeader settings={settings.data} />
      <main className="mx-auto w-full max-w-store px-4 sm:px-6">
        <section className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:py-8">
          <div className="max-w-2xl">
            <p className="mb-2 text-caption font-bold uppercase text-success">Belanja harian, lebih dekat</p>
            <h1 className="text-headline-lg-mobile text-text-primary sm:text-headline-lg">
              Katalog Produk Sembako Segar
            </h1>
            <p className="mt-2 max-w-xl text-body-md text-text-muted">
              Pilih kebutuhan pokok untuk diambil langsung di toko. Ketersediaan mengikuti stok terbaru.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface p-3 sm:min-w-52">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-light text-headline-sm font-extrabold text-secondary-hover">
              ✓
            </span>
            <div>
              <p className="text-body-md font-bold text-text-primary">Jaminan timbang</p>
              <p className="text-caption text-text-muted">Pasti pas &amp; segar</p>
            </div>
          </div>
        </section>

        <div className="sticky top-0 z-10 -mx-4 space-y-3 border-y border-border-subtle bg-canvas/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:space-y-4 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <SearchBar onSearch={setSearch} />
          <CategoryFilter
            value={category}
            onChange={setCategory}
            counts={categoryCounts}
            totalCount={allProducts.data?.length}
          />
        </div>

        {!products.isPending && !products.isError && products.data && (
          <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-headline-sm text-text-primary">Stok toko fisik mandiri</h2>
              <p className="mt-1 text-body-md text-text-muted">
                Menampilkan {products.data.length} produk kebutuhan pokok
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-caption">
              <span className="rounded-full bg-primary-light px-3 py-2 font-bold text-success">
                {availableCount} siap diambil
              </span>
              <span className="rounded-full bg-secondary-light px-3 py-2 font-bold text-secondary-hover">
                {products.data.length - availableCount} menunggu restok
              </span>
            </div>
          </div>
        )}

        <section className="pb-8 pt-4 sm:pt-2" aria-label="Daftar produk">
          {products.isError && !products.data ? (
            <div
              role="alert"
              data-testid="catalog-error"
              className="flex flex-col items-start gap-3 rounded-xl border border-error/20 bg-error-bg p-4 text-error"
            >
              <p className="text-body-lg">Gagal memuat produk. Silakan coba lagi.</p>
              <button
                type="button"
                onClick={() => void products.refetch()}
                className="h-[45px] min-w-[45px] rounded-lg bg-error px-4 text-body-md font-bold text-on-primary"
              >
                Muat Ulang
              </button>
            </div>
          ) : products.isPending ? (
            <ProductGridSkeleton />
          ) : products.data.length === 0 ? (
            <div data-testid="catalog-empty" className="py-16 text-center">
              <p className="text-headline-sm text-text-primary">Produk belum ditemukan</p>
              <p className="mx-auto mt-2 max-w-md text-body-md text-text-muted">
                Tidak ada produk yang sesuai dengan pencarian Anda
              </p>
            </div>
          ) : (
            <ProductGrid products={products.data} />
          )}
        </section>
      </main>
    </>
  );
}
