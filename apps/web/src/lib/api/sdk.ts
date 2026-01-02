import type { PaginationMeta } from '@efizion/contracts';
import { ensureContractsClientConfig } from '../contracts-client';

ensureContractsClientConfig();

export type ApiEnvelope<T> = { data: T };
export type ApiCollectionEnvelope<T> = { data: T[]; meta?: PaginationMeta };

export type CollectionResult<T> = {
  data: T[];
  meta?: PaginationMeta;
};

export function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export function unwrapCollection<T>(payload: T[] | ApiCollectionEnvelope<T>): CollectionResult<T> {
  if (Array.isArray(payload)) {
    return { data: payload };
  }
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    const envelope = payload as ApiCollectionEnvelope<T>;
    return {
      data: Array.isArray(envelope.data) ? envelope.data : [],
      meta: envelope.meta,
    };
  }
  return { data: [] };
}

export function ensureMeta(meta?: PaginationMeta, fallbackLength = 0): PaginationMeta {
  return {
    page: meta?.page ?? 1,
    pageSize: meta?.pageSize ?? fallbackLength,
    total: meta?.total ?? fallbackLength,
    totalPages: meta?.totalPages ?? 1,
  };
}
