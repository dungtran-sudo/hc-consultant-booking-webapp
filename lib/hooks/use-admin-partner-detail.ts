import useSWR from 'swr';
import { adminFetcher } from '@/lib/swr';

interface PartnerDetail {
  id: string;
  name: string;
  type: string;
  website: string;
  bookingEmail: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  specialties: string[];
  notes: string;
  isActive: boolean;
  hasPortalAccess: boolean;
  contractStatus: string;
  contractStartDate: string | null;
  contractEndDate: string | null;
  contractNotes: string;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
  branches: {
    id: string;
    name: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    isActive: boolean;
  }[];
  services: {
    id: string;
    name: string;
    specialty: string;
    description: string;
    priceRange: string;
    duration: string;
    isActive: boolean;
  }[];
}

interface PartnerDetailResponse {
  partner: PartnerDetail;
}

export function useAdminPartnerDetail(secret: string, partnerId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<PartnerDetailResponse>(
    secret && partnerId ? `/api/admin/partners/${partnerId}` : null,
    adminFetcher(secret),
    { dedupingInterval: 5_000, revalidateOnFocus: true },
  );

  return {
    partner: data?.partner ?? null,
    isLoading,
    error,
    mutate,
  };
}
