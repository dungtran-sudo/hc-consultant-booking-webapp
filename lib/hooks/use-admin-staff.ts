import useSWR from 'swr';
import { adminFetcher } from '@/lib/swr';

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface StaffResponse {
  staff: StaffMember[];
}

export function useAdminStaff(secret: string) {
  const { data, error, isLoading, mutate } = useSWR<StaffResponse>(
    secret ? '/api/admin/staff' : null,
    adminFetcher(secret),
    { dedupingInterval: 30 * 60_000, revalidateOnFocus: true },
  );

  return {
    staff: data?.staff ?? [],
    isLoading,
    error,
    mutate,
  };
}

export type { StaffMember };
