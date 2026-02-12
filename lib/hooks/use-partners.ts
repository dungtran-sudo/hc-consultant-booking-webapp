import useSWR from 'swr';
import { fetcher } from '@/lib/swr';
import { Partner } from '@/lib/types';

interface PartnerFilterResponse {
  partners: Partner[];
}

export function usePartnerFilter(specialties: string[], city: string) {
  const key = specialties.length > 0
    ? `/api/partners/filter?specialties=${encodeURIComponent(specialties.join(','))}&city=${encodeURIComponent(city)}`
    : null;

  const { data, error, isLoading } = useSWR<PartnerFilterResponse>(
    key,
    fetcher,
    { dedupingInterval: 5 * 60_000, revalidateOnFocus: false },
  );

  return {
    partners: data?.partners ?? [],
    isLoading,
    error,
  };
}
