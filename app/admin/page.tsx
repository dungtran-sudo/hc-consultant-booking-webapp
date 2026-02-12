'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from './context';

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

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color] || colorClasses.gray}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function UsageBudgetBar({
  label,
  used,
  budget,
  percent,
}: {
  label: string;
  used: number;
  budget: number;
  percent: number;
}) {
  const clampedPercent = Math.min(percent, 100);
  const barColor =
    percent > 80 ? 'bg-red-500' : percent > 60 ? 'bg-yellow-500' : 'bg-green-500';
  const textColor =
    percent > 80 ? 'text-red-700' : percent > 60 ? 'text-yellow-700' : 'text-green-700';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>
          ${used.toFixed(2)} / ${budget.toFixed(2)} ({percent.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${barColor} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { secret } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!secret) return;
    Promise.all([
      fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${secret}` },
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to load stats');
        return r.json();
      }),
      fetch('/api/admin/usage-stats', {
        headers: { Authorization: `Bearer ${secret}` },
      }).then((r) => {
        if (!r.ok) return null;
        return r.json();
      }),
    ])
      .then(([statsData, usageData]) => {
        setStats(statsData);
        setUsageStats(usageData);
      })
      .catch(() => setError('Lỗi khi tải dữ liệu'))
      .finally(() => setLoading(false));
  }, [secret]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Lỗi khi tải dữ liệu'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Tổng quan</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Tổng đặt lịch" value={stats.totalActive} color="blue" />
        <StatCard label="Chờ xử lý" value={stats.statusCounts.pending || 0} color="yellow" />
        <StatCard label="Đã xác nhận" value={stats.statusCounts.confirmed || 0} color="green" />
        <StatCard label="7 ngày qua" value={stats.recentCount} color="purple" />
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Trạng thái</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
          {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => {
            const labels: Record<string, string> = {
              pending: 'Chờ xử lý',
              confirmed: 'Đã xác nhận',
              completed: 'Hoàn thành',
              cancelled: 'Đã hủy',
            };
            return (
              <div key={s} className="bg-white px-4 py-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.statusCounts[s] || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{labels[s]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Partner stats */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Đặt lịch theo đối tác</h3>
        </div>
        {stats.partnerStats.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            Chưa có dữ liệu
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.partnerStats.map((p) => (
              <div key={p.partnerId} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{p.partnerName}</p>
                  <p className="text-xs text-gray-500">{p.partnerId}</p>
                </div>
                <span className="text-lg font-bold text-blue-600">{p.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Bản ghi chấp thuận" value={stats.totalConsents} color="green" />
        <StatCard label="Nhật ký kiểm tra" value={stats.totalAuditLogs} color="gray" />
        <StatCard label="Đã xóa" value={stats.totalDeleted} color="gray" />
      </div>

      {/* AI Usage & Budget */}
      {usageStats && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Chi phí AI (OpenAI)</h2>

          {/* Budget progress bars */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <UsageBudgetBar
              label="Hôm nay"
              used={usageStats.daily.cost}
              budget={usageStats.daily.budget}
              percent={usageStats.daily.utilizationPercent}
            />
            <UsageBudgetBar
              label="Tháng này"
              used={usageStats.monthly.cost}
              budget={usageStats.monthly.budget}
              percent={usageStats.monthly.utilizationPercent}
            />
          </div>

          {/* Call count stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Cuộc gọi hôm nay" value={usageStats.daily.callCount} color="blue" />
            <StatCard label="Cuộc gọi tháng này" value={usageStats.monthly.callCount} color="purple" />
            <StatCard label="Token hôm nay" value={usageStats.daily.totalTokens} color="gray" />
            <StatCard label="Token tháng này" value={usageStats.monthly.totalTokens} color="gray" />
          </div>

          {/* Specialty breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Cuộc gọi theo chuyên khoa (tháng)</h3>
            </div>
            {usageStats.bySpecialty.month.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {usageStats.bySpecialty.month.map((s) => (
                  <div key={s.specialty} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.specialty}</p>
                      <p className="text-xs text-gray-500">${s.cost.toFixed(3)}</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
