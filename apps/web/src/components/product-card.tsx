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
  const sellingUnitLabel = /^isi\b/i.test(product.selling_unit)
    ? product.selling_unit
    : `per 1 ${product.selling_unit}`;

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_2px_6px_-1px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_6px_16px_-2px_rgba(15,23,42,0.09)]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#f0f3ff]">
        {showImage ? (
          <img
            src={product.image_url ?? ''}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            data-testid="product-image-placeholder"
            role="img"
            aria-label={product.name}
            className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ffffff_0%,_#e7eeff_100%)] text-display"
          >
            <span aria-hidden="true">🛍️</span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StockBadge isAvailable={product.is_available} testId={`product-availability-${product.id}`} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <span className="w-fit max-w-full truncate rounded-full bg-secondary-light px-2.5 py-1 text-caption font-bold text-secondary-hover">
          {product.category}
        </span>
        <h3
          data-testid={`product-title-${product.id}`}
          title={product.name}
          className="line-clamp-2 min-h-11 text-headline-sm text-text-primary"
        >
          {product.name}
        </h3>
        <p className="text-caption text-text-muted">{sellingUnitLabel}</p>
        <div className="mt-1">
          <span className="text-caption text-text-muted">Harga</span>
          <p data-testid={`product-price-${product.id}`} className="text-price-md text-primary">
            {formatIdr(product.price_idr)}
          </p>
        </div>
        <p className="text-caption text-text-muted">
          Stok: <span className="font-bold text-text-body">{product.available_quantity} {product.selling_unit}</span>
        </p>
        <button
          type="button"
          data-testid={`product-add-to-cart-btn-${product.id}`}
          disabled={!product.is_available}
          onClick={() => onAdd?.(product)}
          className="mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-body-md font-bold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-border-subtle disabled:text-text-muted"
        >
          <span aria-hidden="true" className="text-headline-sm leading-none">+</span> Tambah
        </button>
      </div>
    </article>
  );
}
