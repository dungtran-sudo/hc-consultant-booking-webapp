'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../context';

interface AuditLogEntry {
  id: string;
  actorType: string;
  actorId: string;
  action: string;
  bookingId: string | null;
  metadata: string | null;
  ip: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  reveal_pii: 'bg-blue-100 text-blue-800',
  patient_data_deleted: 'bg-red-100 text-red-800',
  consent_given: 'bg-green-100 text-green-800',
  booking_status_updated: 'bg-yellow-100 text-yellow-800',
  view_booking_list: 'bg-gray-100 text-gray-600',
  data_expired: 'bg-orange-100 text-orange-800',
  booking_created: 'bg-purple-100 text-purple-800',
};

const ACTION_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'reveal_pii', label: 'Reveal PII' },
  { value: 'booking_created', label: 'Booking Created' },
  { value: 'booking_status_updated', label: 'Status Updated' },
  { value: 'consent_given', label: 'Consent Given' },
  { value: 'patient_data_deleted', label: 'Data Deleted' },
  { value: 'view_booking_list', label: 'View List' },
  { value: 'data_expired', label: 'Data Expired' },
];

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminAuditPage() {
  const { secret } = useAdminAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (actionFilter) params.set('action', actionFilter);
    if (actorFilter) params.set('actor', actorFilter);

    try {
      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [secret, page, actionFilter, actorFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Nhật ký kiểm tra</h2>
        <span className="text-sm text-gray-500">{total} bản ghi</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={actorFilter}
            onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả tác nhân</option>
            <option value="partner">Partner</option>
            <option value="admin">Admin</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Không có dữ liệu
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Thời gian</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tác nhân</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hành động</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Mã đặt lịch</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Dữ liệu</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {formatDate(l.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-900">{l.actorType}</span>
                      <span className="text-xs text-gray-500 ml-1">({l.actorId})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[l.action] || 'bg-gray-100 text-gray-600'}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 hidden sm:table-cell">
                      {l.bookingId ? l.bookingId.substring(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell max-w-[200px] truncate">
                      {l.metadata || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                      {l.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
