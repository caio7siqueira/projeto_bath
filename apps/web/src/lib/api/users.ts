import { apiFetch } from '../api';

export type UserRole = 'ADMIN' | 'STAFF' | 'GROOMER' | 'FINANCE' | 'SUPER_ADMIN';

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  tenantId: string | null;
  tenant?: TenantSummary | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserCollection {
  data: UserRecord[];
  meta: PaginationMeta;
}

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: UserRole;
  onlyActive?: boolean;
  tenantId?: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  password?: string;
  sendInvite?: boolean;
}

export interface CreateUserResponse {
  user: UserRecord;
  temporaryPassword?: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export interface ResetPasswordResponse {
  user: UserRecord;
  temporaryPassword: string;
}

export async function listUsers(params?: ListUsersParams): Promise<UserCollection> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.q) qs.set('q', params.q);
  if (params?.role) qs.set('role', params.role);
  if (params?.onlyActive) qs.set('onlyActive', 'true');
  if (params?.tenantId) qs.set('tenantId', params.tenantId);
  const query = qs.toString();
  return apiFetch(`/users${query ? `?${query}` : ''}`) as Promise<UserCollection>;
}

export async function createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(request),
  }) as Promise<CreateUserResponse>;
}

export async function updateUser(userId: string, request: UpdateUserRequest): Promise<UserRecord> {
  return apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  }) as Promise<UserRecord>;
}

export async function deactivateUser(userId: string): Promise<{ message: string }> {
  return apiFetch(`/users/${userId}`, {
    method: 'DELETE',
  }) as Promise<{ message: string }>;
}

export async function resetUserPassword(userId: string): Promise<ResetPasswordResponse> {
  return apiFetch(`/users/${userId}/reset-password`, {
    method: 'POST',
  }) as Promise<ResetPasswordResponse>;
}
