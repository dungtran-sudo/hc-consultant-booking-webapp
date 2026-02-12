import useSWR from 'swr';
import { adminFetcher } from '@/lib/swr';
import { MaskedBooking } from '@/lib/types';

interface AdminBookingsParams {
  page: number;
  search?: string;
  status?: string;
  partner?: string;
  from?: string;
  to?: string;
}

interface AdminBookingsResponse {
  bookings: MaskedBooking[];
  total: number;
  page: number;
  totalPages: number;
}

export function useAdminBookings(secret: string, params: AdminBookingsParams) {
  const searchParams = new URLSearchParams({ page: String(params.page), limit: '20' });
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.partner) searchParams.set('partner', params.partner);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);

  const { data, error, isLoading, mutate } = useSWR<AdminBookingsResponse>(
    secret ? `/api/admin/bookings?${searchParams}` : null,
    adminFetcher(secret),
    { dedupingInterval: 10_000, revalidateOnFocus: true },
  );

  return {
    bookings: data?.bookings ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}
