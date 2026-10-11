import { useQuery } from '@tanstack/react-query';
import type { PublicStoreSettings } from '@santo/shared';
import { apiGet } from '../lib/api-client';

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: ({ signal }) => apiGet<PublicStoreSettings>('/store-settings', undefined, signal),
  });
}
