'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import PIIConsentGate from '@/components/PIIConsentGate';
import { RevealedPII } from '@/lib/types';
import { usePartnerBookings } from '@/lib/hooks/use-partner-bookings';

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

const STAT_CARDS = [
  { key: '', label: 'Tổng cộng', color: 'bg-white border-gray-200 text-gray-900', iconBg: 'bg-gray-100' },
  { key: 'pending', label: 'Chờ xử lý', color: 'bg-white border-yellow-200 text-yellow-800', iconBg: 'bg-yellow-100' },
  { key: 'confirmed', label: 'Đã xác nhận', color: 'bg-white border-blue-200 text-blue-800', iconBg: 'bg-blue-100' },
  { key: 'completed', label: 'Hoàn thành', color: 'bg-white border-green-200 text-green-800', iconBg: 'bg-green-100' },
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
    });
  } catch {
    return iso;
  }
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [localError, setLocalError] = useState('');
  const [revealedPII, setRevealedPII] = useState<Record<string, RevealedPII | null>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    bookingId: string;
    bookingNumber: string;
    newStatus: string;
  } | null>(null);
  const [showPIIGate, setShowPIIGate] = useState(false);
  const [pendingRevealId, setPendingRevealId] = useState<string | null>(null);

  const {
    bookings,
    partnerName,
    partnerId,
    total,
    totalPages,
    statusCounts,
    isLoading: loading,
    error: swrError,
    mutate,
  } = usePartnerBookings({ page, status: statusFilter, search, dateFrom, dateTo });

  const error = localError || (swrError ? 'Lỗi khi tải dữ liệu' : '');

  // Handle 401 redirect from SWR error
  useEffect(() => {
    if (swrError && (swrError as Error & { status?: number }).status === 401) {
      const savedPartnerId = localStorage.getItem('partnerId');
      router.push(savedPartnerId ? `/partner/login/${savedPartnerId}` : '/partner/login');
    }
  }, [swrError, router]);

  // Persist partnerId to localStorage
  useEffect(() => {
    if (partnerId) localStorage.setItem('partnerId', partnerId);
  }, [partnerId]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = search || statusFilter || dateFrom || dateTo;

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
      });

      if (res.status === 401) {
        const savedPartnerId = localStorage.getItem('partnerId');
        router.push(savedPartnerId ? `/partner/login/${savedPartnerId}` : '/partner/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLocalError(data.error || 'Lỗi khi tải chi tiết');
        return;
      }

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
      setLocalError('Lỗi khi tải chi tiết');
    } finally {
      setRevealingId(null);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/partner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        mutate();
      } else {
        const data = await res.json().catch(() => ({}));
        setLocalError(data.error || 'Lỗi khi cập nhật trạng thái');
      }
    } catch {
      setLocalError('Lỗi khi cập nhật');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/partner/logout', { method: 'POST' });
    router.push(partnerId ? `/partner/login/${partnerId}` : '/partner/login');
  };

  const totalBookings = statusCounts.pending + statusCounts.confirmed + statusCounts.completed + statusCounts.cancelled;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Hello Health Group" className="h-9 rounded" />
            <div>
              <h1 className="text-lg font-bold">Portal Đối Tác</h1>
              {partnerName && (
                <p className="text-sm text-blue-100">{partnerName}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAT_CARDS.map((card) => {
            const count = card.key ? (statusCounts[card.key] || 0) : totalBookings;
            const isActive = statusFilter === card.key;
            return (
              <button
                key={card.key}
                onClick={() => { setStatusFilter(card.key); setPage(1); }}
                className={`rounded-xl border p-4 text-left transition-all ${card.color} ${
                  isActive ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-sm'
                }`}
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Mã đặt lịch..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Lọc
              </button>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Danh sách đặt lịch</h2>
          <span className="text-sm text-gray-500">{total} kết quả</span>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSpinner message="Đang tải dữ liệu..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            Chưa có đặt lịch nào
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Dịch vụ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Địa chỉ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Ngày khám</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Giờ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Người tạo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => {
                    const isExpanded = expandedId === b.id;
                    const revealed = revealedPII[b.id];
                    const isRevealed = b.id in revealedPII;
                    const isDeleted = isRevealed && revealed === null;
                    const isUpdating = updatingId === b.id;

                    return (
                      <>
                        <tr key={b.id} className={`hover:bg-gray-50 ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-4 py-3 font-mono text-blue-600 font-semibold text-xs whitespace-nowrap">
                            {b.bookingNumber}
                          </td>
                          <td className="px-4 py-3 text-gray-900 max-w-[180px] truncate">
                            {b.serviceName}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate hidden md:table-cell">
                            {b.branchAddress}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell">
                            {b.preferredDate?.split('-').reverse().join('/')}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell">
                            {b.preferredTime}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden lg:table-cell">
                            {b.bookedByStaffName || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || STATUS_COLORS.pending}`}>
                              {STATUS_LABELS[b.status] || b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => {
                                  setExpandedId(isExpanded ? null : b.id);
                                  if (!isExpanded && !isRevealed) requestReveal(b.id);
                                }}
                                disabled={revealingId === b.id}
                                className={`text-xs px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors ${
                                  isDeleted
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : isExpanded
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                {revealingId === b.id
                                  ? '...'
                                  : isExpanded
                                    ? 'Ẩn'
                                    : 'Xem'}
                              </button>
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: 'confirmed' })}
                                    disabled={isUpdating}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                                  >
                                    Xác nhận
                                  </button>
                                  <button
                                    onClick={() => setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: 'cancelled' })}
                                    disabled={isUpdating}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                                  >
                                    Hủy
                                  </button>
                                </>
                              )}
                              {b.status === 'confirmed' && (
                                <>
                                  <button
                                    onClick={() => setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: 'completed' })}
                                    disabled={isUpdating}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                                  >
                                    Hoàn thành
                                  </button>
                                  <button
                                    onClick={() => setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: 'cancelled' })}
                                    disabled={isUpdating}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                                  >
                                    Hủy
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded PII row */}
                        {isExpanded && isRevealed && (
                          <tr key={`${b.id}-pii`}>
                            <td colSpan={8} className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                              {isDeleted ? (
                                <p className="text-sm text-gray-400">Dữ liệu đã được xóa theo yêu cầu của bệnh nhân.</p>
                              ) : revealed ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">Bệnh nhân: </span>
                                    <span className="font-medium text-gray-900">{revealed.patientName}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">SĐT: </span>
                                    <span className="font-medium text-gray-900">{revealed.phone}</span>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-gray-500">Tình trạng: </span>
                                    <span className="text-gray-700">{revealed.conditionSummary}</span>
                                  </div>
                                  {revealed.notes && (
                                    <div className="sm:col-span-2 lg:col-span-4">
                                      <span className="text-gray-500">Ghi chú: </span>
                                      <span className="text-gray-700">{revealed.notes}</span>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
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
      </main>

      {/* PII consent gate */}
      {showPIIGate && (
        <PIIConsentGate
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
            message: `Bạn có chắc muốn xác nhận đặt lịch ${pendingAction.bookingNumber}?`,
            variant: 'primary',
            confirmLabel: 'Xác nhận',
          },
          completed: {
            title: 'Hoàn thành đặt lịch',
            message: `Bạn có chắc muốn đánh dấu hoàn thành đặt lịch ${pendingAction.bookingNumber}?`,
            variant: 'primary',
            confirmLabel: 'Hoàn thành',
          },
          cancelled: {
            title: 'Hủy đặt lịch',
            message: `Bạn có chắc muốn hủy đặt lịch ${pendingAction.bookingNumber}? Hành động này không thể hoàn tác.`,
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
              await handleStatusUpdate(pendingAction.bookingId, pendingAction.newStatus);
              setPendingAction(null);
            }}
          />
        );
      })()}
    </div>
  );
}
