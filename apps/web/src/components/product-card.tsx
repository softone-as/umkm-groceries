import { useState } from 'react';
import { formatIdr, type ProductCatalogItem } from '@santo/shared';
import { StockBadge } from './stock-badge';

interface ProductCardProps {
  product: ProductCatalogItem;
  onAdd?: (product: ProductCatalogItem) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = product.image_url !== null && !imageFailed;

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface"
    >
      <div className="aspect-square w-full bg-primary-light">
        {showImage ? (
          <img
            src={product.image_url ?? ''}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            data-testid="product-image-placeholder"
            role="img"
            aria-label={product.name}
            className="flex h-full w-full items-center justify-center text-display"
          >
            🛒
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3
          data-testid={`product-title-${product.id}`}
          title={product.name}
          className="line-clamp-2 text-headline-sm text-text-primary"
        >
          {product.name}
        </h3>
        <span className="text-caption text-text-muted">per 1 {product.selling_unit}</span>
        <span data-testid={`product-price-${product.id}`} className="text-price-md text-primary">
          {formatIdr(product.price_idr)}
        </span>
        <div>
          <StockBadge isAvailable={product.is_available} testId={`product-availability-${product.id}`} />
        </div>
        <button
          type="button"
          data-testid={`product-add-to-cart-btn-${product.id}`}
          disabled={!product.is_available}
          onClick={() => onAdd?.(product)}
          className="mt-auto inline-flex h-11 w-full items-center justify-center gap-1 rounded-lg bg-primary text-body-md font-bold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-border-subtle disabled:text-text-muted"
        >
          <span aria-hidden="true">+</span> Tambah
        </button>
      </div>
    </article>
  );
}
