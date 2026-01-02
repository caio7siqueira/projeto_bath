import { ServicesService, type CreateServiceDto as ContractsCreateServiceDto } from '@efizion/contracts';
import { safeSdkCall } from './errors';
import { unwrapCollection, unwrapData } from './sdk';

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

export type CreateServiceDto = ContractsCreateServiceDto;

export async function listServices(params?: { page?: number; pageSize?: number; includeInactive?: boolean }) {
  const response = await safeSdkCall(
    ServicesService.servicesControllerFindAll({
      page: params?.page,
      pageSize: params?.pageSize,
      includeInactive: params?.includeInactive,
    }),
    'Não conseguimos carregar os serviços agora.',
  );
  const { data } = unwrapCollection<Service>(response as any);
  return data;
}

export async function createService(dto: CreateServiceDto): Promise<Service> {
  const response = await safeSdkCall(
    ServicesService.servicesControllerCreate({
      requestBody: dto,
    }),
    'Não foi possível criar o serviço.',
  );
  return unwrapData<Service>(response as any);
}
