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
        className="h-11 w-full rounded-full border border-border-subtle bg-surface pl-10 pr-12 text-body-lg text-text-primary [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          data-testid="search-clear-btn"
          aria-label="Hapus pencarian"
          onClick={handleClear}
          className="absolute right-0 flex h-11 w-11 items-center justify-center text-text-muted"
        >
          <span aria-hidden="true" className="text-headline-md leading-none">×</span>
        </button>
      )}
    </div>
  );
}
