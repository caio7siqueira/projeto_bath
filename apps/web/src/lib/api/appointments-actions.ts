

import { apiFetch } from '../api';
import { getAuthToken } from './client';


export async function markAppointmentDone(id: string): Promise<any> {
  return apiFetch(`/appointments/${id}/mark-done`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}
