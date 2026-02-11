'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../context';

interface ConsentRecord {
  id: string;
  phoneHashPrefix: string;
  version: string;
  createdAt: string;
}

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

export default function AdminConsentsPage() {
  const { secret } = useAdminAuth();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchConsents = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/consents?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setConsents(data.consents || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setConsents([]);
    } finally {
      setLoading(false);
    }
  }, [secret, page]);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Bản ghi chấp thuận</h2>
        <span className="text-sm text-gray-500">{total} bản ghi</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : consents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Chưa có dữ liệu
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mã</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Phone Hash</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Phiên bản</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consents.map((c, i) => (
                  <tr key={`${c.id}-${i}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.id}...</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {c.phoneHashPrefix === 'ANONYMIZED' ? (
                        <span className="text-gray-400">ANONYMIZED</span>
                      ) : (
                        <span className="text-gray-600">{c.phoneHashPrefix}...</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {c.version}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
