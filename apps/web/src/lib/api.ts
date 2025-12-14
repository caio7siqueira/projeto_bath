const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${API_BASE_URL}${path}`);
    return res.json();
  },
};
