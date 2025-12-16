const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  optInGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pet {
  id: string;
  tenantId: string;
  customerId: string;
  name: string;
  species: 'DOG' | 'CAT';
  lifeStatus: 'ALIVE' | 'DECEASED';
  allowNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerContact {
  id: string;
  tenantId: string;
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchCustomer(token: string, customerId: string): Promise<Customer> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch customer: ${res.status}`);
  return res.json();
}

export async function fetchCustomerPets(token: string, customerId: string): Promise<Pet[]> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}/pets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch pets: ${res.status}`);
  return res.json();
}

export async function fetchCustomerContacts(token: string, customerId: string): Promise<CustomerContact[]> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}/contacts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch contacts: ${res.status}`);
  return res.json();
}
