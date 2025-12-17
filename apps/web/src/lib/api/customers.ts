import { getAuthToken } from './client';

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

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  optInGlobal?: boolean;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

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

// Customers CRUD
export async function listCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE}/v1/customers`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to list customers: ${res.status}`);
  return res.json();
}

export async function fetchCustomer(token: string, customerId: string): Promise<Customer> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch customer: ${res.status}`);
  return res.json();
}

export async function createCustomer(dto: CreateCustomerDto): Promise<Customer> {
  const res = await fetch(`${API_BASE}/v1/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Failed to create customer: ${res.status}`);
  return res.json();
}

export async function updateCustomer(
  customerId: string,
  dto: UpdateCustomerDto
): Promise<Customer> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Failed to update customer: ${res.status}`);
  return res.json();
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to delete customer: ${res.status}`);
}

export async function fetchCustomerPets(token: string, customerId: string): Promise<Pet[]> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}/pets`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch pets: ${res.status}`);
  return res.json();
}

// Pets CRUD
export interface CreatePetDto {
  name: string;
  species: 'DOG' | 'CAT';
  lifeStatus?: 'ALIVE' | 'DECEASED';
  allowNotifications?: boolean;
}

export interface UpdatePetDto extends Partial<CreatePetDto> {}

export async function listPets(): Promise<Pet[]> {
  const res = await fetch(`${API_BASE}/v1/pets`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to list pets: ${res.status}`);
  return res.json();
}

export async function createPet(customerId: string, dto: CreatePetDto): Promise<Pet> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Failed to create pet: ${res.status}`);
  return res.json();
}

export async function updatePet(
  petId: string,
  dto: UpdatePetDto
): Promise<Pet> {
  const res = await fetch(`${API_BASE}/v1/pets/${petId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Failed to update pet: ${res.status}`);
  return res.json();
}

export async function deletePet(petId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/pets/${petId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to delete pet: ${res.status}`);
}

export async function fetchCustomerContacts(token: string, customerId: string): Promise<CustomerContact[]> {
  const res = await fetch(`${API_BASE}/v1/customers/${customerId}/contacts`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch contacts: ${res.status}`);
  return res.json();
}
