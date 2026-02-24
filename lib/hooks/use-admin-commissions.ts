import useSWR from 'swr';
import { adminFetcher } from '@/lib/swr';
import { CommissionStatement } from '@/lib/types';

interface AdminCommissionsParams {
  page: number;
  partnerId?: string;
  month?: string;
  year?: string;
  status?: string;
}

interface AdminCommissionsResponse {
  statements: CommissionStatement[];
  total: number;
  page: number;
  totalPages: number;
}

export function useAdminCommissions(secret: string, params: AdminCommissionsParams) {
  const searchParams = new URLSearchParams({ page: String(params.page), limit: '20' });
  if (params.partnerId) searchParams.set('partnerId', params.partnerId);
  if (params.month) searchParams.set('month', params.month);
  if (params.year) searchParams.set('year', params.year);
  if (params.status) searchParams.set('status', params.status);

  const { data, error, isLoading, mutate } = useSWR<AdminCommissionsResponse>(
    secret ? `/api/admin/commissions?${searchParams}` : null,
    adminFetcher(secret),
    { dedupingInterval: 10_000, revalidateOnFocus: true },
  );

  return {
    statements: data?.statements ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}
