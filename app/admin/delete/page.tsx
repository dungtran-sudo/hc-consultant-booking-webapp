'use client';

import { useState } from 'react';
import { useAdminAuth } from '../context';

export default function AdminDeletePage() {
  const { secret } = useAdminAuth();
  const [phone, setPhone] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ found: boolean; deleted: number } | null>(null);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'XOA') return;

    setDeleting(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/delete-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      if (res.status === 401) {
        setError('Sai mã admin');
        return;
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setPhone('');
        setConfirmText('');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Xóa dữ liệu bệnh nhân</h2>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700 font-medium">
          Xóa toàn bộ dữ liệu bệnh nhân (crypto-shredding). Hành động này không thể hoàn tác.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại bệnh nhân
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nhập &quot;XOA&quot; để xác nhận
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="XOA"
          />
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting || !phone.trim() || confirmText !== 'XOA'}
          className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Đang xóa...' : 'Xóa dữ liệu bệnh nhân'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {result && (
          <div
            className={`px-4 py-3 rounded-lg text-sm border ${
              result.found
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}
          >
            {result.found
              ? `Đã xóa thành công ${result.deleted} đặt lịch.`
              : 'Không tìm thấy dữ liệu cho số điện thoại này.'}
          </div>
        )}
      </div>
    </div>
  );
}
