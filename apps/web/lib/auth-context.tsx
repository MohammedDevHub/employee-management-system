'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, CurrentUser } from './api';

interface AuthContextValue {
  user: CurrentUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'lofa_access_token';
const REFRESH_TOKEN_KEY = 'lofa_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    api
      .me(stored)
      .then((me) => {
        setAccessToken(stored);
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { accessToken: token, refreshToken } = await api.login(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    const me = await api.me(token);
    setAccessToken(token);
    setUser(me);
    router.push('/dashboard');
  }

  function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
