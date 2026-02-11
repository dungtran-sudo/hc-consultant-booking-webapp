'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StaffInfo {
  staffId: string;
  name: string;
  role: string;
}

export default function StaffAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/staff/me')
      .then((res) => {
        if (res.status === 401) {
          router.push('/staff/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setStaff(data);
      })
      .catch(() => {
        router.push('/staff/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Đang xác thực...</p>
      </div>
    );
  }

  if (!staff) return null;

  return (
    <>
      <div className="fixed top-2 right-2 z-50 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
        <span className="font-medium">{staff.name}</span>
        <span className="opacity-75">({staff.role})</span>
        <button
          onClick={async () => {
            await fetch('/api/staff/logout', { method: 'POST' });
            router.push('/staff/login');
          }}
          className="ml-1 hover:text-blue-200 transition-colors"
        >
          &times;
        </button>
      </div>
      {children}
    </>
  );
}
