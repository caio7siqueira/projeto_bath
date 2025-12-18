import { apiFetch } from '../api';
import { getAuthToken } from './client';

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function listServices(): Promise<Service[]> {
  return apiFetch('/v1/services', {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}
