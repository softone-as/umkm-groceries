import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ProductCatalogItem } from '@santo/shared';
import { apiGet } from '../lib/api-client';

export function useProducts(category: string | undefined, search: string) {
  const term = search.trim();
  return useQuery({
    queryKey: ['products', { category: category ?? null, search: term }],
    queryFn: async ({ signal }) => {
      const res = await apiGet<{ products: ProductCatalogItem[] }>(
        '/products',
        { category, search: term || undefined },
        signal,
      );
      return res.products;
    },
    placeholderData: keepPreviousData,
  });
}
