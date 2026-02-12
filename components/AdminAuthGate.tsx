'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/app/admin/context';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setSecret } = useAdminAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${input.trim()}` },
      });

      if (res.status === 401) {
        setError('Sai mã admin');
        return;
      }

      if (!res.ok) {
        setError('Lỗi kết nối');
        return;
      }

      setSecret(input.trim());
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full">
        <img src="/logo.jpeg" alt="Hello Health Group" className="h-14 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          HHG Internal
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Nhập mã admin để tiếp tục
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin secret..."
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
