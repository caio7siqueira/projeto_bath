

import { apiFetch } from '../api';
import { getAuthToken } from './client';


export async function markAppointmentDone(id: string): Promise<any> {
  return apiFetch(`/v1/appointments/${id}/mark-done`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}


export async function markAppointmentNoShow(id: string): Promise<any> {
  return apiFetch(`/v1/appointments/${id}/mark-no-show`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}
