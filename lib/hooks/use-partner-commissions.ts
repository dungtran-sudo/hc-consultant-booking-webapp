import useSWR from 'swr';
import { fetcher } from '@/lib/swr';
import { CommissionStatement } from '@/lib/types';

interface PartnerCommissionsResponse {
  statements: CommissionStatement[];
}

export function usePartnerCommissions() {
  const { data, error, isLoading } = useSWR<PartnerCommissionsResponse>(
    '/api/partner/commissions',
    fetcher,
    { dedupingInterval: 30_000, revalidateOnFocus: true },
  );

  return {
    statements: data?.statements ?? [],
    isLoading,
    error,
  };
}
