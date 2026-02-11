'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import PIIConsentGate from '@/components/PIIConsentGate';
import { MaskedBooking, RevealedPII } from '@/lib/types';

const STATUS_TABS = [
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

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<MaskedBooking[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    try {
      const r = await fetch(`/api/partner/bookings?${params}`);
      if (r.status === 401) {
        router.push('/partner/login');
        return;
      }
      const data = await r.json();
      setBookings(data.bookings || []);
      setPartnerName(data.partnerName || '');
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [router, page, statusFilter, search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
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
      setError('Lỗi khi tải chi tiết');
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
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } catch {
      setError('Lỗi khi cập nhật');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/partner/logout', { method: 'POST' });
    router.push('/partner/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">HelloBacsi Booking - Portal Đối Tác</h1>
            {partnerName && (
              <p className="text-sm text-blue-100">{partnerName}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm theo mã đặt lịch (#)..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Tìm
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition-colors"
              >
                Xóa
              </button>
            )}
          </div>
        </form>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 mb-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Danh sách đặt lịch
          </h2>
          <span className="text-sm text-gray-500">{total} kết quả</span>
        </div>

        {loading ? (
          <LoadingSpinner message="Đang tải dữ liệu..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Chưa có đặt lịch nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const revealed = revealedPII[b.id];
              const isRevealed = b.id in revealedPII;
              const isRevealing = revealingId === b.id;
              const isDeleted = isRevealed && revealed === null;
              const isUpdating = updatingId === b.id;

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Main row */}
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono text-blue-600 font-semibold">
                            #{b.bookingNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || STATUS_COLORS.pending}`}>
                            {STATUS_LABELS[b.status] || b.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                          {b.serviceName}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                          <span>{b.branchAddress}</span>
                          <span>{b.preferredDate} {b.preferredTime}</span>
                          {b.bookedByStaffName && (
                            <span>Người tạo: {b.bookedByStaffName}</span>
                          )}
                          <span className="hidden sm:inline">{formatDate(b.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 items-end shrink-0">
                        <button
                          onClick={() => requestReveal(b.id)}
                          disabled={isRevealed || isRevealing}
                          className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                            isDeleted
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isRevealed
                                ? 'bg-green-50 text-green-700 cursor-default'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          {isRevealing
                            ? 'Đang tải...'
                            : isDeleted
                              ? 'Đã xóa'
                              : isRevealed
                                ? 'Đã xem'
                                : 'Xem chi tiết'}
                        </button>

                        {/* Status actions */}
                        {b.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: 'confirmed' })}
                              disabled={isUpdating}
                              className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              Xác nhận
                            </button>
                            <button
                              onClick={() => setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: 'cancelled' })}
                              disabled={isUpdating}
                              className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: 'completed' })}
                              disabled={isUpdating}
                              className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              Hoàn thành
                            </button>
                            <button
                              onClick={() => setPendingAction({ bookingId: b.id, bookingNumber: b.bookingNumber, newStatus: 'cancelled' })}
                              disabled={isUpdating}
                              className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Revealed PII */}
                  {isRevealed && revealed && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Bệnh nhân: </span>
                          <span className="font-medium text-gray-900">
                            {revealed.patientName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">SDT: </span>
                          <span className="font-medium text-gray-900">
                            {revealed.phone}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-500">Tình trạng: </span>
                          <span className="text-gray-700">
                            {revealed.conditionSummary}
                          </span>
                        </div>
                        {revealed.notes && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Ghi chú: </span>
                            <span className="text-gray-700">
                              {revealed.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isDeleted && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <p className="text-sm text-gray-400">
                        Dữ liệu đã được xóa theo yêu cầu của bệnh nhân.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
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
              await handleStatusUpdate(pendingAction.bookingId, pendingAction.newStatus);
              setPendingAction(null);
            }}
          />
        );
      })()}
    </div>
  );
}
