import useSWR from 'swr';
import { adminFetcher } from '@/lib/swr';

interface UsageStats {
  daily: {
    cost: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    callCount: number;
    budget: number;
    utilizationPercent: number;
  };
  monthly: {
    cost: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    callCount: number;
    budget: number;
    utilizationPercent: number;
  };
  bySpecialty: {
    month: { specialty: string; count: number; cost: number }[];
    today: { specialty: string; count: number; cost: number }[];
  };
}

interface AdminStats {
  totalActive: number;
  totalDeleted: number;
  statusCounts: Record<string, number>;
  partnerStats: { partnerId: string; partnerName: string; count: number }[];
  recentCount: number;
  totalConsents: number;
  totalAuditLogs: number;
}

export function useAdminStats(secret: string) {
  const fetch = adminFetcher(secret);
  const stats = useSWR<AdminStats>(
    secret ? '/api/admin/stats' : null,
    fetch,
    { dedupingInterval: 5 * 60_000, revalidateOnFocus: true },
  );
  const usage = useSWR<UsageStats>(
    secret ? '/api/admin/usage-stats' : null,
    fetch,
    { dedupingInterval: 5 * 60_000, revalidateOnFocus: true },
  );

  return {
    stats: stats.data ?? null,
    usageStats: usage.data ?? null,
    isLoading: stats.isLoading || usage.isLoading,
    error: stats.error || usage.error,
    mutateStats: stats.mutate,
    mutateUsage: usage.mutate,
  };
}

export type { AdminStats, UsageStats };
