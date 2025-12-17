import { getAuthToken } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export type BillingStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INACTIVE';

export interface BillingSubscription {
  id: string;
  tenantId: string;
  plan: string;
  status: BillingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertBillingSubscriptionDto {
  plan: string;
  status: BillingStatus;
}

export async function fetchBillingSubscription(): Promise<BillingSubscription | null> {
  const res = await fetch(`${API_BASE}/admin/billing/subscription`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Falha ao carregar assinatura: ${res.status}`);
  }

  return res.json();
}

export async function upsertBillingSubscription(
  dto: UpsertBillingSubscriptionDto,
): Promise<BillingSubscription> {
  const res = await fetch(`${API_BASE}/admin/billing/subscription`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    throw new Error(`Falha ao salvar assinatura: ${res.status}`);
  }

  return res.json();
}
