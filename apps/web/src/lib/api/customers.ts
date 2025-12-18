
import { apiFetch } from '../api';
import { getAuthToken } from './client';

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
  return apiFetch('/customers', {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export async function fetchCustomer(token: string, customerId: string): Promise<Customer> {
  return apiFetch(`/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export async function createCustomer(dto: CreateCustomerDto): Promise<Customer> {
  return apiFetch('/v1/customers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}

export async function updateCustomer(
  customerId: string,
  dto: UpdateCustomerDto
): Promise<Customer> {
  return apiFetch(`/v1/customers/${customerId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}

export async function deleteCustomer(customerId: string): Promise<void> {
  await apiFetch(`/v1/customers/${customerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export async function fetchCustomerPets(token: string, customerId: string): Promise<Pet[]> {
  return apiFetch(`/v1/customers/${customerId}/pets`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
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
  return apiFetch('/v1/pets', {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export async function createPet(customerId: string, dto: CreatePetDto): Promise<Pet> {
  return apiFetch(`/v1/customers/${customerId}/pets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}

export async function updatePet(
  petId: string,
  dto: UpdatePetDto
): Promise<Pet> {
  return apiFetch(`/v1/pets/${petId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}

export async function deletePet(petId: string): Promise<void> {
  await apiFetch(`/v1/pets/${petId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export async function fetchCustomerContacts(token: string, customerId: string): Promise<CustomerContact[]> {
  return apiFetch(`/v1/customers/${customerId}/contacts`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}
