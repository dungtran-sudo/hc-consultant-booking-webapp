'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminAuthContextType {
  secret: string;
  setSecret: (s: string) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  secret: '',
  setSecret: () => {},
  isAuthenticated: false,
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [secret, setSecretState] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_secret');
    if (stored) setSecretState(stored);
  }, []);

  const setSecret = (s: string) => {
    setSecretState(s);
    if (s) {
      sessionStorage.setItem('admin_secret', s);
    } else {
      sessionStorage.removeItem('admin_secret');
    }
  };

  const logout = () => {
    setSecretState('');
    sessionStorage.removeItem('admin_secret');
  };

  return (
    <AdminAuthContext.Provider
      value={{ secret, setSecret, isAuthenticated: !!secret, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
