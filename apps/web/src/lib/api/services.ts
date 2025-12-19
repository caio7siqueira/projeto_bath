import { apiFetch } from '../api';
import { getAuthToken } from './client';

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  baseDurationMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  baseDurationMinutes: number;
  active?: boolean;
}

export async function listServices(): Promise<Service[]> {
  return apiFetch('/services', {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export async function createService(dto: CreateServiceDto): Promise<Service> {
  return apiFetch('/services', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}
