import { PaginationMeta } from './pagination.dto';

export interface ApiResponse<T> {
  data: T;
}

export interface ApiCollectionResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

export function createApiCollectionResponse<T>(
  data: T[],
  meta?: Partial<PaginationMeta>,
): ApiCollectionResponse<T> {
  return {
    data,
    meta: ensureMeta(meta, data.length),
  };
}

function ensureMeta(meta: Partial<PaginationMeta> | undefined, length: number): PaginationMeta {
  const safeLength = typeof length === 'number' ? length : 0;
  return {
    page: meta?.page ?? 1,
    pageSize: meta?.pageSize ?? (safeLength === 0 ? 0 : safeLength),
    total: meta?.total ?? safeLength,
    totalPages: meta?.totalPages ?? 1,
  };
}