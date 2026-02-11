'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../context';

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  cs: 'CS',
  doctor: 'Bác sĩ',
  admin: 'Quản trị',
};

const ROLE_COLORS: Record<string, string> = {
  cs: 'bg-blue-100 text-blue-800',
  doctor: 'bg-green-100 text-green-800',
  admin: 'bg-purple-100 text-purple-800',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function AdminStaffPage() {
  const { secret } = useAdminAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('cs');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const fetchStaff = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setStaff(data.staff || []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPassword) return;
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim() || undefined,
          role: newRole,
          password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Lỗi tạo tài khoản');
        return;
      }

      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('cs');
      setShowForm(false);
      fetchStaff();
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/staff/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchStaff();
  };

  const handleResetPassword = async () => {
    if (!resetId || !resetPassword) return;
    await fetch(`/api/admin/staff/${resetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ newPassword: resetPassword }),
    });
    setResetId(null);
    setResetPassword('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Quản lý nhân viên</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Đóng' : '+ Thêm nhân viên'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tạo tài khoản mới</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="cs">CS</option>
                  <option value="doctor">Bác sĩ</option>
                  <option value="admin">Quản trị</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={creating || !newName.trim() || !newPassword}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </form>
        </div>
      )}

      {/* Staff table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Chưa có nhân viên nào
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tên</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vai trò</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Ngày tạo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[s.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[s.role] || s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${s.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {s.isActive ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(s.id, s.isActive)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          s.isActive
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {s.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      </button>
                      <button
                        onClick={() => { setResetId(s.id); setResetPassword(''); }}
                        className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                      >
                        Đặt lại MK
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset password modal */}
      {resetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setResetId(null)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Đặt lại mật khẩu</h3>
            <input
              type="password"
              placeholder="Mật khẩu mới"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setResetId(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!resetPassword}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
