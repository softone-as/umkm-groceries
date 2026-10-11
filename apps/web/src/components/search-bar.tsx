import { useState } from 'react';
import { useDebouncedCallback } from '../hooks/use-debounced-callback';

interface SearchBarProps {
  onSearch: (value: string) => void;
  debounceMs?: number;
}

export function SearchBar({ onSearch, debounceMs = 300 }: SearchBarProps) {
  const [value, setValue] = useState('');
  const debounced = useDebouncedCallback(onSearch, debounceMs);

  const handleChange = (next: string) => {
    setValue(next);
    debounced.call(next);
  };

  const handleClear = () => {
    debounced.cancel();
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative flex w-full items-center">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3 h-5 w-5 text-text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        data-testid="search-input"
        aria-label="Cari produk"
        placeholder="Cari produk…"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-border-subtle bg-surface pl-11 pr-12 text-body-md text-text-primary shadow-[0_2px_6px_-1px_rgba(15,23,42,0.04)] outline-none transition-shadow placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          data-testid="search-clear-btn"
          aria-label="Hapus pencarian"
          onClick={handleClear}
          className="absolute right-0 flex h-[45px] w-[45px] items-center justify-center rounded-r-xl text-text-muted transition-colors hover:bg-canvas hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span aria-hidden="true" className="text-headline-md leading-none">×</span>
        </button>
      )}
    </div>
  );
}
