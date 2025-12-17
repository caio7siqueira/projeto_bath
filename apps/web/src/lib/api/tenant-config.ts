import { getAuthToken } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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
  const res = await fetch(`${API_BASE}/admin/tenant-config`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Falha ao carregar configurações do tenant: ${res.status}`);
  }
  return res.json();
}

export async function updateTenantConfig(dto: UpdateTenantConfigDto): Promise<TenantConfig> {
  const res = await fetch(`${API_BASE}/admin/tenant-config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    throw new Error(`Falha ao atualizar configurações do tenant: ${res.status}`);
  }
  return res.json();
}
