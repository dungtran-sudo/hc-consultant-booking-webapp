'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MaskedBooking, RevealedPII } from '@/lib/types';

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
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
  const [revealedPII, setRevealedPII] = useState<
    Record<string, RevealedPII | null>
  >({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/partner/bookings')
      .then((r) => {
        if (r.status === 401) {
          router.push('/partner/login');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setBookings(data.bookings || []);
          setPartnerName(data.partnerName || '');
        }
      })
      .catch(() => setError('Lỗi khi tải dữ liệu'))
      .finally(() => setLoading(false));
  }, [router]);

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

  const handleLogout = async () => {
    await fetch('/api/partner/logout', { method: 'POST' });
    router.push('/partner/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Portal Đối Tác</h1>
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Danh sách đặt lịch
        </h2>

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

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm font-mono text-blue-600 font-semibold whitespace-nowrap">
                        #{b.bookingNumber}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {b.serviceName}
                      </span>
                      <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:inline">
                        {b.branchAddress}
                      </span>
                      <span className="text-sm text-gray-500 whitespace-nowrap hidden md:inline">
                        {b.preferredDate} {b.preferredTime}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap hidden lg:inline">
                        {formatDate(b.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleReveal(b.id)}
                      disabled={isRevealed || isRevealing}
                      className={`text-sm px-3 py-1.5 rounded-lg whitespace-nowrap ml-2 transition-colors ${
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
                          ? 'Đã xoá'
                          : isRevealed
                            ? 'Đã xem'
                            : 'Xem chi tiết'}
                    </button>
                  </div>

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
                          <span className="text-gray-500">SĐT: </span>
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
                        Dữ liệu đã được xoá theo yêu cầu của bệnh nhân.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
