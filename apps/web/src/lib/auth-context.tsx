'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh, type LoginRequest } from './api/auth';
import { normalizeApiError } from '@/lib/api/errors';

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
const DEMO_ACCESS_TOKEN = process.env.NEXT_PUBLIC_DEMO_TOKEN ?? '';

function buildUserFromToken(token: string): User {
  try {
    const [, payload = ''] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    return {
      id: decoded.sub ?? 'demo-user',
      email: decoded.email ?? 'demo@efizion.com',
      name: decoded.name ?? 'Admin Demo',
      role: decoded.role ?? 'ADMIN',
      tenantId: decoded.tenantId ?? 'demo-tenant',
    } as User;
  } catch {
    return {
      id: 'demo-user',
      email: 'demo@efizion.com',
      name: 'Admin Demo',
      role: 'ADMIN',
      tenantId: 'demo-tenant',
    };
  }
}

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

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedRefresh) {
        setRefreshToken(storedRefresh);
      }
      setIsLoading(false);
      return;
    }

    if (DEMO_ACCESS_TOKEN) {
      const demoUser = buildUserFromToken(DEMO_ACCESS_TOKEN);
      setAccessToken(DEMO_ACCESS_TOKEN);
      setRefreshToken(null);
      setUser(demoUser);
      localStorage.setItem('accessToken', DEMO_ACCESS_TOKEN);
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.removeItem('refreshToken');
      setIsLoading(false);
      return;
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
      throw normalizeApiError(err, 'Não foi possível fazer login. Verifique as credenciais.');
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
