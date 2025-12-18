
// Usa obrigatoriamente NEXT_PUBLIC_API_URL, sem fallback hardcoded
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL não definida. Configure no .env.local ou ambiente de produção.');
}

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${API_URL}${path}`);
    return res.json();
  },
};
