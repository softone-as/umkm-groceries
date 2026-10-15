import type { ProductCatalogItem } from '@santo/shared';
import { ProductCard } from './product-card';

export function ProductGrid({
  products,
  onAdd,
}: {
  products: readonly ProductCatalogItem[];
  onAdd(product: ProductCatalogItem): void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAdd} />
      ))}
    </div>
  );
}
