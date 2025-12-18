import { getAuthToken } from './client';

import { apiFetch } from '../api';

export interface TenantConfig {
  id: string;
  tenantId: string;
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  cancelWindowHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantConfigDto {
  reminderEnabled?: boolean;
  reminderHoursBefore?: number;
  cancelWindowHours?: number;
}

export async function fetchTenantConfig(): Promise<TenantConfig> {
  return apiFetch('/v1/admin/tenant-config', {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
}

export async function updateTenantConfig(dto: UpdateTenantConfigDto): Promise<TenantConfig> {
  return apiFetch('/v1/admin/tenant-config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(dto),
  });
}
