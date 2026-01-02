import { OpenAPI } from '@efizion/contracts';
import { getApiBaseUrl } from './api';
import { getAuthToken } from './api/client';

let configured = false;

function resolveBaseUrl() {
  const base = getApiBaseUrl();
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

export function ensureContractsClientConfig() {
  if (configured) {
    return;
  }

  OpenAPI.BASE = resolveBaseUrl();
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';
  OpenAPI.TOKEN = async () => {
    const token = getAuthToken();
    return token || undefined;
  };

  configured = true;
}

ensureContractsClientConfig();
