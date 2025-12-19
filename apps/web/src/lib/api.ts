import { getAuthToken } from './api/client';

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
      window.location.href = '/login';
    }
    throw { message: 'Não autorizado. Faça login novamente.', status: 401 };
  }
  if (!res.ok) {
    let error;
    try { error = await res.json(); } catch { error = { message: 'Erro na API' }; }
    throw error;
  }
  return res.json();
}
