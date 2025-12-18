
import { apiFetch } from '../api';

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'STAFF';
    tenantId: string;
  };
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


export async function refresh(data: RefreshRequest): Promise<RefreshResponse> {
  return apiFetch('/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


export async function logout(accessToken: string, refreshToken: string): Promise<void> {
  await apiFetch('/v1/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refreshToken }),
  });
}
