import useSWR from 'swr';
import { fetcher } from '@/lib/swr';
import { MaskedBooking } from '@/lib/types';

interface PartnerBookingsParams {
  page: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface PartnerBookingsResponse {
  partnerId: string;
  partnerName: string;
  bookings: MaskedBooking[];
  total: number;
  page: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

export function usePartnerBookings(params: PartnerBookingsParams) {
  const searchParams = new URLSearchParams({ page: String(params.page), limit: '20' });
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);

  const { data, error, isLoading, mutate } = useSWR<PartnerBookingsResponse>(
    `/api/partner/bookings?${searchParams}`,
    fetcher,
    { dedupingInterval: 10_000, revalidateOnFocus: true, refreshInterval: 30_000 },
  );

  return {
    bookings: data?.bookings ?? [],
    partnerName: data?.partnerName ?? '',
    partnerId: data?.partnerId ?? '',
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    statusCounts: data?.statusCounts ?? { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
    isLoading,
    error,
    mutate,
  };
}
