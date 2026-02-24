import useSWR from 'swr';
import { adminFetcher } from '@/lib/swr';

interface AdminPartnersParams {
  page: number;
  search?: string;
  type?: string;
  city?: string;
  contractStatus?: string;
  isActive?: string;
}

interface PartnerListItem {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string;
  phone: string;
  contractStatus: string;
  contractEndDate: string | null;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
}

interface AdminPartnersResponse {
  partners: PartnerListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function useAdminPartners(secret: string, params: AdminPartnersParams) {
  const searchParams = new URLSearchParams({ page: String(params.page), limit: '20' });
  if (params.search) searchParams.set('search', params.search);
  if (params.type) searchParams.set('type', params.type);
  if (params.city) searchParams.set('city', params.city);
  if (params.contractStatus) searchParams.set('contractStatus', params.contractStatus);
  if (params.isActive) searchParams.set('isActive', params.isActive);

  const { data, error, isLoading, mutate } = useSWR<AdminPartnersResponse>(
    secret ? `/api/admin/partners?${searchParams}` : null,
    adminFetcher(secret),
    { dedupingInterval: 10_000, revalidateOnFocus: true },
  );

  return {
    partners: data?.partners ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}
