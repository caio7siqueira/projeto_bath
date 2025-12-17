import { getAuthToken } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function markAppointmentDone(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/appointments/${id}/mark-done`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to mark as done: ${res.status}`);
  return res.json();
}

export async function markAppointmentNoShow(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/appointments/${id}/mark-no-show`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to mark as no-show: ${res.status}`);
  return res.json();
}
