

// Cliente HTTP centralizado para toda a aplicação web
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL não definida. Configure no .env.local ou ambiente de produção.');
}

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let error;
    try { error = await res.json(); } catch { error = { message: 'Erro na API' }; }
    throw error;
  }
  return res.json();
}
