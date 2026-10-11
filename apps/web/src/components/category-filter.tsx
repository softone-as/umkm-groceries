export const CATEGORIES = [
  'Beras',
  'Minyak Goreng',
  'Gula Pasir',
  'Telur Ayam',
  'Tepung Terigu',
  'Bumbu Dapur',
  'Mie & Pasta',
  'Lainnya',
] as const;

interface CategoryFilterProps {
  value: string | undefined;
  onChange: (category: string | undefined) => void;
  counts: Readonly<Record<string, number>> | undefined;
  totalCount: number | undefined;
}

export function CategoryFilter({ value, onChange, counts, totalCount }: CategoryFilterProps) {
  const chips: { label: string; category: string | undefined }[] = [
    { label: 'Semua', category: undefined },
    ...CATEGORIES.map((c) => ({ label: c, category: c })),
  ];

  return (
    <div
      data-testid="category-filter-select"
      role="group"
      aria-label="Filter kategori"
      className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible"
    >
      {chips.map(({ label, category }) => {
        const active = category === value;
        const count =
          counts === undefined
            ? undefined
            : category === undefined
              ? totalCount
              : counts[category] ?? 0;
        return (
          <button
            key={label}
            type="button"
            data-testid="category-chip"
            aria-pressed={active}
            onClick={() => onChange(category)}
            className={`inline-flex h-[45px] min-h-[45px] min-w-[45px] shrink-0 items-center rounded-full border px-4 text-body-md whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active
                ? 'border-primary bg-primary font-bold text-on-primary'
                : 'border-border-subtle bg-surface text-text-body hover:border-primary/40 hover:bg-primary-light/50'
            }`}
          >
            {label}
            {count !== undefined && (
              <span
                aria-label={`${count} produk`}
                className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-caption ${
                  active ? 'bg-on-primary/15 text-on-primary' : 'bg-canvas text-text-muted'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
