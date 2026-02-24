'use client';

import { useState } from 'react';
import { useAdminAuth } from '../context';
import { useAdminCommissions } from '@/lib/hooks/use-admin-commissions';
import ConfirmDialog from '@/components/ConfirmDialog';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}));

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN');
}

export default function AdminCommissionsPage() {
  const { secret } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPartner, setFilterPartner] = useState('');

  const [showConsolidate, setShowConsolidate] = useState(false);
  const [conMonth, setConMonth] = useState(String(new Date().getMonth() + 1));
  const [conYear, setConYear] = useState(String(new Date().getFullYear()));
  const [conPartner, setConPartner] = useState('');
  const [consolidating, setConsolidating] = useState(false);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<{ id: string; value: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'confirm' | 'paid'; partnerName: string } | null>(null);

  const { statements, total, totalPages, isLoading, mutate } = useAdminCommissions(secret, {
    page, partnerId: filterPartner, month: filterMonth, year: filterYear, status: filterStatus,
  });

  const apiCall = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Lỗi server');
    }
    return res.json();
  };

  const handleConsolidate = async () => {
    setConsolidating(true);
    setError('');
    try {
      const result = await apiCall('/api/admin/commissions', 'POST', {
        month: parseInt(conMonth),
        year: parseInt(conYear),
        partnerId: conPartner || undefined,
      });
      setShowConsolidate(false);
      mutate();
      alert(`Đã tổng hợp ${result.consolidated} đối tác cho tháng ${conMonth}/${conYear}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConsolidating(false);
    }
  };

  const handleSaveRevenue = async () => {
    if (!editingRevenue) return;
    setSaving(true);
    setError('');
    try {
      await apiCall(`/api/admin/commissions/${editingRevenue.id}`, 'PATCH', {
        totalRevenue: parseFloat(editingRevenue.value) || 0,
      });
      setEditingRevenue(null);
      mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setSaving(true);
    setError('');
    try {
      await apiCall(`/api/admin/commissions/${id}`, 'PATCH', { status: newStatus });
      mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Hoa hồng đối tác</h2>
        <button
          onClick={() => setShowConsolidate(!showConsolidate)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showConsolidate ? 'Đóng' : 'Tổng hợp tháng'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Consolidation controls */}
      {showConsolidate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tổng hợp hoa hồng</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={conMonth}
                onChange={(e) => setConMonth(e.target.value)}
              >
                {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={conYear}
                onChange={(e) => setConYear(e.target.value)}
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đối tác (tùy chọn)</label>
              <input
                type="text"
                placeholder="ID đối tác..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={conPartner}
                onChange={(e) => setConPartner(e.target.value)}
              />
            </div>
            <button
              onClick={handleConsolidate}
              disabled={consolidating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {consolidating ? 'Đang xử lý...' : 'Tạo báo cáo'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tháng</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={filterMonth}
              onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả</option>
              {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Năm</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="paid">Đã thanh toán</option>
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Đối tác</label>
            <input
              type="text"
              placeholder="ID đối tác..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{total} báo cáo</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : statements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Chưa có báo cáo hoa hồng
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Đối tác</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tháng/Năm</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Bookings</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Doanh thu</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 hidden sm:table-cell">HH %</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Hoa hồng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statements.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.partnerName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.month}/{s.year}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{s.completedBookings}</td>
                    <td className="px-4 py-3 text-right">
                      {editingRevenue?.id === s.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                            value={editingRevenue.value}
                            onChange={(e) => setEditingRevenue({ ...editingRevenue, value: e.target.value })}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveRevenue}
                            disabled={saving}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingRevenue(null)}
                            className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`${s.status === 'draft' ? 'cursor-pointer hover:text-blue-600' : ''} text-gray-900`}
                          onClick={() => {
                            if (s.status === 'draft') {
                              setEditingRevenue({ id: s.id, value: String(s.totalRevenue) });
                            }
                          }}
                        >
                          {formatCurrency(s.totalRevenue)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">{s.commissionRate}%</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(s.commissionAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {s.status === 'draft' && (
                          <>
                            <button
                              onClick={() => setEditingRevenue({ id: s.id, value: String(s.totalRevenue) })}
                              className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              Nhập DT
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: s.id, action: 'confirm', partnerName: s.partnerName })}
                              className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100"
                            >
                              Xác nhận
                            </button>
                          </>
                        )}
                        {s.status === 'confirmed' && (
                          <button
                            onClick={() => setConfirmAction({ id: s.id, action: 'paid', partnerName: s.partnerName })}
                            className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100"
                          >
                            Đã thanh toán
                          </button>
                        )}
                        {s.status === 'paid' && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
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
          <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            Sau
          </button>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.action === 'confirm' ? 'Xác nhận hoa hồng' : 'Thanh toán hoa hồng'}
          message={
            confirmAction.action === 'confirm'
              ? `Xác nhận báo cáo hoa hồng cho ${confirmAction.partnerName}? Đối tác sẽ thấy báo cáo này.`
              : `Đánh dấu đã thanh toán hoa hồng cho ${confirmAction.partnerName}?`
          }
          variant="primary"
          confirmLabel={confirmAction.action === 'confirm' ? 'Xác nhận' : 'Đã thanh toán'}
          loading={saving}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => handleStatusChange(confirmAction.id, confirmAction.action === 'confirm' ? 'confirmed' : 'paid')}
        />
      )}
    </div>
  );
}
