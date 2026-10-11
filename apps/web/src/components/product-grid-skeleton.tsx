export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      data-testid="product-grid-skeleton"
      aria-busy="true"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
          <div className="shimmer aspect-square w-full" />
          <div className="space-y-2 p-3">
            <div className="shimmer h-4 w-3/4 rounded" />
            <div className="shimmer h-4 w-1/2 rounded" />
            <div className="shimmer h-11 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
