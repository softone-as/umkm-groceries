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
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
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
        return (
          <button
            key={label}
            type="button"
            data-testid="category-chip"
            aria-pressed={active}
            onClick={() => onChange(category)}
            className={`inline-flex h-11 min-w-11 shrink-0 items-center rounded-full border px-4 text-body-md whitespace-nowrap ${
              active
                ? 'border-primary bg-primary font-bold text-on-primary'
                : 'border-border-subtle bg-surface text-text-body'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
