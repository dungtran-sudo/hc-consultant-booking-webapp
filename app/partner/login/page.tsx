'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PartnerOption {
  id: string;
  name: string;
}

export default function PartnerLoginPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [partnerId, setPartnerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/partner/list')
      .then((r) => r.json())
      .then((data) => setPartners(data.partners || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !password) {
      setError('Vui lòng chọn đối tác và nhập mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      router.push('/partner/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full">
        <img src="/logo.jpeg" alt="Hello Health Group" className="h-14 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Portal Đối Tác
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Hello Bác Sĩ
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đối tác
            </label>
            <select
              className={inputClass}
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            >
              <option value="">-- Chọn đối tác --</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
