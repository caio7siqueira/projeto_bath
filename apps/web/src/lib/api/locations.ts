
import { apiFetch } from '../api';

export interface Location {
  id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationDto {
  name: string;
}

import { getAuthToken } from './client';

export async function listLocations(): Promise<Location[]> {
  return apiFetch('/v1/locations', {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}

export async function createLocation(dto: CreateLocationDto): Promise<Location> {
  return apiFetch('/v1/locations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}
