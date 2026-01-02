import {
  CustomersService,
  PetsService,
  type CreateCustomerDto as ContractsCreateCustomerDto,
  type UpdateCustomerDto as ContractsUpdateCustomerDto,
  type CreatePetDto as ContractsCreatePetDto,
  type UpdatePetDto as ContractsUpdatePetDto,
} from '@efizion/contracts';
import { safeSdkCall } from './errors';
import { ensureMeta, unwrapCollection, unwrapData } from './sdk';

// Listar todos os pets do tenant (global, paginado)
export interface ListAllPetsResult {
  items: Pet[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type CreateCustomerDto = ContractsCreateCustomerDto;
export type UpdateCustomerDto = ContractsUpdateCustomerDto;
export type CreatePetDto = ContractsCreatePetDto;
export type UpdatePetDto = ContractsUpdatePetDto;

export interface ListCustomersFilters {
  page?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
  email?: string;
  phone?: string;
}

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

// Customers CRUD
export async function listCustomers(params?: ListCustomersFilters) {
  const response = await safeSdkCall(
    CustomersService.customersControllerFindAll({
      page: params?.page,
      pageSize: params?.pageSize,
      sort: params?.sort,
      q: params?.q,
      email: params?.email,
      phone: params?.phone,
    }),
    'Não conseguimos carregar os clientes agora.',
  );
  return unwrapCollection<Customer>(response as any);
}

export async function fetchCustomer(_token: string, customerId: string): Promise<Customer> {
  const response = await safeSdkCall(
    CustomersService.customersControllerFindOne({ id: customerId }),
    'Não conseguimos carregar o cliente selecionado.',
  );
  return unwrapData<Customer>(response as any);
}

export async function createCustomer(dto: CreateCustomerDto): Promise<Customer> {
  const response = await safeSdkCall(
    CustomersService.customersControllerCreate({
      requestBody: dto,
    }),
    'Não foi possível criar o cliente.',
  );
  return unwrapData<Customer>(response as any);
}

export async function updateCustomer(
  customerId: string,
  dto: UpdateCustomerDto
): Promise<Customer> {
  const response = await safeSdkCall(
    CustomersService.customersControllerUpdate({
      id: customerId,
      requestBody: dto,
    }),
    'Não foi possível atualizar o cliente.',
  );
  return unwrapData<Customer>(response as any);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  await safeSdkCall(
    CustomersService.customersControllerSoftDelete({ id: customerId }),
    'Não foi possível remover o cliente.',
  );
}

export async function fetchCustomerPets(_token: string, customerId: string): Promise<Pet[]> {
  return listPets(customerId);
}

export async function listPets(customerId: string): Promise<Pet[]> {
  const response = await safeSdkCall(
    PetsService.petsControllerList({ customerId }),
    'Não foi possível listar os pets deste cliente.',
  );
  const { data } = unwrapCollection<Pet>(response as any);
  return data;
}

export async function createPet(customerId: string, dto: CreatePetDto): Promise<Pet> {
  const response = await safeSdkCall(
    PetsService.petsControllerCreate({
      customerId,
      requestBody: dto,
    }),
    'Não foi possível criar o pet.',
  );
  return unwrapData<Pet>(response as any);
}

// updatePet e deletePet removidos pois endpoint /pets/:petId não existe

export async function fetchCustomerContacts(_token: string, customerId: string): Promise<CustomerContact[]> {
  const response = await safeSdkCall(
    CustomersService.customersControllerFindContacts({ customerId }),
    'Não foi possível listar os contatos do cliente.',
  );
  const { data } = unwrapCollection<CustomerContact>(response as any);
  return data;
}

export async function listAllPets(params?: { page?: number; pageSize?: number; q?: string }): Promise<ListAllPetsResult> {
  const response = await safeSdkCall(
    PetsService.petsControllerListAll({
      page: params?.page,
      pageSize: params?.pageSize,
      q: params?.q,
    }),
    'Não conseguimos carregar os pets agora.',
  );
  const collection = unwrapCollection<Pet>(response as any);
  const meta = ensureMeta(collection.meta, collection.data.length);
  return {
    items: collection.data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
    totalPages: meta.totalPages,
  };
}
