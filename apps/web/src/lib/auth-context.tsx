'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh, type LoginRequest } from './api/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN';
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedRefresh && storedUser) {
      setAccessToken(storedToken);
      setRefreshToken(storedRefresh);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Auto-refresh token before expiry (optional enhancement)
  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiRefresh({ refreshToken });
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
      } catch (err) {
        console.error('Token refresh failed', err);
        await logout();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [refreshToken]);

  const login = async (data: LoginRequest) => {
    try {
      const response = await apiLogin(data);
      setUser(response.user);
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      router.push('/admin/dashboard');
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    if (accessToken && refreshToken) {
      try {
        await apiLogout(accessToken, refreshToken);
      } catch (err) {
        console.error('Logout API call failed', err);
      }
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
