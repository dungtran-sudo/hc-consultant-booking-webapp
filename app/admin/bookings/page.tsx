'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../context';
import { MaskedBooking, RevealedPII } from '@/lib/types';
import ConfirmDialog from '@/components/ConfirmDialog';
import PIIConsentGate from '@/components/PIIConsentGate';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminBookingsPage() {
  const { secret } = useAdminAuth();
  const [bookings, setBookings] = useState<MaskedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedPII, setRevealedPII] = useState<Record<string, RevealedPII | null>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    bookingId: string;
    bookingNumber: string;
    newStatus: string;
  } | null>(null);
  const [showPIIGate, setShowPIIGate] = useState(false);
  const [pendingRevealId, setPendingRevealId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (partnerFilter) params.set('partner', partnerFilter);

    try {
      const res = await fetch(`/api/admin/bookings?${params}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [secret, page, search, statusFilter, partnerFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const requestReveal = (bookingId: string) => {
    if (revealedPII[bookingId] !== undefined) return;
    if (!sessionStorage.getItem('pii_consent_ack')) {
      setPendingRevealId(bookingId);
      setShowPIIGate(true);
      return;
    }
    handleReveal(bookingId);
  };

  const handleReveal = async (bookingId: string) => {
    if (revealedPII[bookingId] !== undefined) return;
    setRevealingId(bookingId);
    try {
      const res = await fetch(`/api/partner/bookings/${bookingId}/reveal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (data.deleted) {
        setRevealedPII((prev) => ({ ...prev, [bookingId]: null }));
      } else if (data.patientName) {
        setRevealedPII((prev) => ({
          ...prev,
          [bookingId]: {
            patientName: data.patientName,
            phone: data.phone,
            conditionSummary: data.conditionSummary,
            notes: data.notes,
          },
        }));
      }
    } catch {
      // ignore
    } finally {
      setRevealingId(null);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Đặt lịch</h2>
        <span className="text-sm text-gray-500">{total} kết quả</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Tìm theo mã (#)..."
            className="flex-1 min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Mã đối tác..."
            className="min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Không có kết quả
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dịch vụ</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Đối tác</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Ngày khám</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Người tạo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden xl:table-cell">Ngày tạo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const isExpanded = expandedId === b.id;
                  const revealed = revealedPII[b.id];
                  const isRevealed = b.id in revealedPII;
                  const isDeleted = isRevealed && revealed === null;

                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-blue-600 font-semibold">
                        {b.bookingNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">
                        {b.serviceName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {b.partnerName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell whitespace-nowrap">
                        {b.preferredDate?.split('-').reverse().join('/')} {b.preferredTime}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || STATUS_COLORS.pending}`}>
                            {STATUS_LABELS[b.status] || b.status}
                          </span>
                          {b.status !== 'completed' && b.status !== 'cancelled' && (
                            <select
                              className="text-xs border border-gray-200 rounded px-1 py-0.5"
                              value=""
                              disabled={updatingId === b.id}
                              onChange={(e) => {
                                if (e.target.value) setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: e.target.value });
                              }}
                            >
                              <option value="">...</option>
                              {b.status === 'pending' && <option value="confirmed">Xác nhận</option>}
                              {b.status === 'pending' && <option value="cancelled">Hủy</option>}
                              {b.status === 'confirmed' && <option value="completed">Hoàn thành</option>}
                              {b.status === 'confirmed' && <option value="cancelled">Hủy</option>}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell whitespace-nowrap">
                        {b.bookedByStaffName || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden xl:table-cell whitespace-nowrap">
                        {formatDate(b.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setExpandedId(isExpanded ? null : b.id);
                            if (!isExpanded && !isRevealed) requestReveal(b.id);
                          }}
                          disabled={revealingId === b.id}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          {revealingId === b.id
                            ? 'Đang tải...'
                            : isExpanded
                              ? 'Ẩn'
                              : 'Xem'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expanded row detail */}
          {expandedId && (() => {
            const revealed = revealedPII[expandedId];
            const isRevealed = expandedId in revealedPII;
            const isDeleted = isRevealed && revealed === null;

            if (!isRevealed) return null;

            return (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                {isDeleted ? (
                  <p className="text-sm text-gray-400">Dữ liệu đã được xóa.</p>
                ) : revealed ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Bệnh nhân: </span>
                      <span className="font-medium text-gray-900">{revealed.patientName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">SDT: </span>
                      <span className="font-medium text-gray-900">{revealed.phone}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Tình trạng: </span>
                      <span className="text-gray-700">{revealed.conditionSummary}</span>
                    </div>
                    {revealed.notes && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-500">Ghi chú: </span>
                        <span className="text-gray-700">{revealed.notes}</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })()}
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
      {/* PII consent gate */}
      {showPIIGate && (
        <PIIConsentGate
          authHeader={`Bearer ${secret}`}
          onAccept={() => {
            setShowPIIGate(false);
            if (pendingRevealId) {
              handleReveal(pendingRevealId);
              setExpandedId(pendingRevealId);
              setPendingRevealId(null);
            }
          }}
          onCancel={() => {
            setShowPIIGate(false);
            setPendingRevealId(null);
          }}
        />
      )}

      {/* Confirmation dialog */}
      {pendingAction && (() => {
        const statusMessages: Record<string, { title: string; message: string; variant: 'primary' | 'danger'; confirmLabel: string }> = {
          confirmed: {
            title: 'Xác nhận đặt lịch',
            message: `Bạn có chắc muốn xác nhận đặt lịch #${pendingAction.bookingNumber}?`,
            variant: 'primary',
            confirmLabel: 'Xác nhận',
          },
          completed: {
            title: 'Hoàn thành đặt lịch',
            message: `Bạn có chắc muốn đánh dấu hoàn thành đặt lịch #${pendingAction.bookingNumber}?`,
            variant: 'primary',
            confirmLabel: 'Hoàn thành',
          },
          cancelled: {
            title: 'Hủy đặt lịch',
            message: `Bạn có chắc muốn hủy đặt lịch #${pendingAction.bookingNumber}? Hành động này không thể hoàn tác.`,
            variant: 'danger',
            confirmLabel: 'Hủy đặt lịch',
          },
        };
        const config = statusMessages[pendingAction.newStatus];
        return (
          <ConfirmDialog
            title={config.title}
            message={config.message}
            variant={config.variant}
            confirmLabel={config.confirmLabel}
            loading={updatingId === pendingAction.bookingId}
            onCancel={() => setPendingAction(null)}
            onConfirm={async () => {
              await handleStatusChange(pendingAction.bookingId, pendingAction.newStatus);
              setPendingAction(null);
            }}
          />
        );
      })()}
    </div>
  );
}
