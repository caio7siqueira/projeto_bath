import { LocationsService, type CreateLocationDto as ContractsCreateLocationDto } from '@efizion/contracts';
import { safeSdkCall } from './errors';
import { unwrapCollection, unwrapData } from './sdk';

export interface Location {
  id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateLocationDto = ContractsCreateLocationDto;

export async function listLocations(): Promise<Location[]> {
  const response = await safeSdkCall(
    LocationsService.locationsControllerFindByTenant({}),
    'Não foi possível carregar os locais.',
  );
  const { data } = unwrapCollection<Location>(response as any);
  return data;
}

export async function createLocation(dto: CreateLocationDto): Promise<Location> {
  const response = await safeSdkCall(
    LocationsService.locationsControllerCreate({
      requestBody: dto,
    }),
    'Não foi possível criar o local.',
  );
  return unwrapData<Location>(response as any);
}
