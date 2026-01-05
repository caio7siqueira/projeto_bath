import { AuthService, type LoginDto, type RefreshDto } from '@efizion/contracts';
import { apiFetch } from '../api';
import { safeSdkCall } from './errors';
import { unwrapData } from './sdk';

export type LoginRequest = LoginDto;

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'STAFF' | 'GROOMER' | 'FINANCE' | 'SUPER_ADMIN';
    tenantId: string;
  };
}

export type RefreshRequest = RefreshDto;

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await safeSdkCall(
    AuthService.authControllerLogin({ requestBody: data }),
    'Email ou senha inválidos.',
  );
  return unwrapData<LoginResponse>(response as any);
}


export async function refresh(data: RefreshRequest): Promise<RefreshResponse> {
  const response = await safeSdkCall(
    AuthService.authControllerRefresh({ requestBody: data }),
    'Não foi possível renovar a sessão.',
  );
  return unwrapData<RefreshResponse>(response as any);
}


export async function logout(accessToken: string, refreshToken: string): Promise<void> {
  // API do SDK ainda não suporta enviar body no logout; mantemos fetch direto aqui.
  await apiFetch('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refreshToken }),
  });
}
