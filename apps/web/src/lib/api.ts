import Router from 'next/router';
import { getAuthToken } from './api/client';
import { normalizeApiError } from './api/errors';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Centraliza a configuração da API para todo o frontend
export function getApiBaseUrl() {
  return API_URL;
}

export function getApiUrl(path: string) {
  const base = getApiBaseUrl();
  if (!path.startsWith('/')) path = '/' + path;
  return base + '/v1' + path;
}

// Cliente HTTP centralizado para toda a aplicação web
export async function apiFetch(path: string, options?: RequestInit) {
  const url = getApiUrl(path);
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options && options.headers ? options.headers : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, {
    ...(options || {}),
    credentials: 'include',
    headers,
  });
  if (res.status === 401) {
    // Limpa tokens e redireciona para login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      Router.replace('/login');
    }
    throw normalizeApiError(
      {
        status: 401,
        code: 'AUTH_UNAUTHORIZED',
        message: 'Não autorizado. Faça login novamente.',
      },
      'Não autorizado. Faça login novamente.',
    );
  }
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw normalizeApiError(
      {
        status: res.status,
        ...(typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}),
      },
      'Não conseguimos concluir a operação agora. Tente novamente.',
    );
  }
  return res.json();
}
