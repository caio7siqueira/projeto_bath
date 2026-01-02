import type { ApiError as SdkApiError } from '@efizion/contracts';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  hint?: string;
}

export interface NormalizedApiError {
  name: 'ApiError';
  code: string;
  title: string;
  message: string;
  details: ApiErrorDetail[];
  status?: number;
  context?: Record<string, unknown>;
  raw?: unknown;
}

const DEFAULT_FALLBACK_MESSAGE = 'Não conseguimos concluir a ação. Tente novamente.';

const ERROR_DICTIONARY: Record<string, { title: string; description: string; field?: string }> = {
  AUTH_INVALID_CREDENTIALS: {
    title: 'Credenciais inválidas',
    description: 'Email ou senha não conferem. Revise os campos e tente novamente.',
    field: 'email',
  },
  CUSTOMER_ALREADY_EXISTS: {
    title: 'Cliente duplicado',
    description: 'Já existe um cliente com este email ou telefone.',
    field: 'email',
  },
  PET_ALREADY_EXISTS: {
    title: 'Pet já cadastrado',
    description: 'Verifique se o nome e cliente correspondem a um pet existente.',
    field: 'name',
  },
  SERVICE_DUPLICATE_NAME: {
    title: 'Nome de serviço em uso',
    description: 'Escolha um nome diferente para continuar.',
    field: 'name',
  },
  APPOINTMENT_CONFLICT: {
    title: 'Conflito de horário',
    description: 'Já existe um agendamento neste período/local. Ajuste o horário.',
    field: 'startsAt',
  },
  BILLING_PAYMENT_FAILED: {
    title: 'Pagamento não autorizado',
    description: 'Atualize os dados do cartão ou tente outro método de pagamento.',
  },
  REPORTS_INVALID_RANGE: {
    title: 'Período inválido',
    description: 'Selecione um intervalo de datas válido para gerar o relatório.',
  },
};

function defaultTitleForStatus(status?: number) {
  if (!status) return 'Algo não saiu como esperado';
  if (status >= 500) return 'Estamos com instabilidade';
  if (status === 401) return 'Sessão expirada';
  if (status === 403) return 'Acesso negado';
  if (status === 404) return 'Não encontramos o recurso';
  if (status === 409) return 'Conflito detectado';
  if (status === 422) return 'Revise os campos informados';
  return 'Verifique os dados informados';
}

function isSdkApiError(error: unknown): error is SdkApiError {
  return typeof error === 'object' && error !== null && 'status' in error && 'body' in error;
}

function normalizeDetails(details: unknown): ApiErrorDetail[] {
  if (!details) return [];
  if (Array.isArray(details)) {
    const normalized = details
      .map((entry) => {
        if (typeof entry === 'string') {
          return { message: entry };
        }
        if (typeof entry === 'object' && entry !== null) {
          const field = typeof (entry as any).field === 'string' ? (entry as any).field : undefined;
          const message =
            typeof (entry as any).message === 'string'
              ? (entry as any).message
              : typeof (entry as any).detail === 'string'
              ? (entry as any).detail
              : undefined;
          return message ? { field, message } : undefined;
        }
        return undefined;
      })
      .filter(Boolean) as ApiErrorDetail[];
    return normalized;
  }

  if (typeof details === 'object') {
    return Object.entries(details as Record<string, unknown>).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((message) => ({ field, message: String(message) }));
      }
      if (typeof value === 'object' && value !== null) {
        const nestedMessage =
          typeof (value as any).message === 'string'
            ? (value as any).message
            : typeof (value as any).detail === 'string'
            ? (value as any).detail
            : String(value);
        return [{ field: (value as any).field ?? field, message: nestedMessage }];
      }
      return [{ field, message: String(value) }];
    });
  }

  return [{ message: String(details) }];
}

function extractContext(payload: any): Record<string, unknown> | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const context: Record<string, unknown> = {};
  if ('conflictingAppointments' in payload) {
    context.conflictingAppointments = payload.conflictingAppointments;
  }
  if ('invalidFields' in payload) {
    context.invalidFields = payload.invalidFields;
  }
  return Object.keys(context).length ? context : undefined;
}

export function isNormalizedApiError(error: unknown): error is NormalizedApiError {
  return typeof error === 'object' && error !== null && 'code' in error && 'details' in error && 'title' in error;
}

export function normalizeApiError(error: unknown, fallbackMessage = DEFAULT_FALLBACK_MESSAGE): NormalizedApiError {
  if (isNormalizedApiError(error)) {
    return error;
  }

  const baseError = isSdkApiError(error)
    ? {
        status: error.status,
        body: error.body,
        message: (error as any).message,
      }
    : typeof error === 'object' && error !== null
    ? (error as Record<string, unknown>)
    : { message: typeof error === 'string' ? error : undefined };

  const body = (baseError as any).body ?? baseError;
  const rawCode = typeof body?.code === 'string' ? body.code : typeof (baseError as any).code === 'string' ? (baseError as any).code : undefined;
  const status = (baseError as any).status ?? (baseError as any).statusCode ?? body?.status;
  const code = rawCode || (status ? `HTTP_${status}` : 'UNKNOWN_ERROR');
  const dictionaryEntry = ERROR_DICTIONARY[code];
  const serverMessage =
    typeof body?.message === 'string'
      ? body.message
      : typeof (baseError as any).message === 'string'
      ? (baseError as any).message
      : undefined;
  const details = normalizeDetails(body?.details ?? body?.errors ?? body?.errorDetails);
  const title = dictionaryEntry?.title ?? defaultTitleForStatus(status);
  const message = dictionaryEntry?.description ?? serverMessage ?? fallbackMessage;
  const normalized: NormalizedApiError = {
    name: 'ApiError',
    code,
    title,
    message,
    details,
    status,
    context: extractContext(body),
    raw: error ?? body,
  };

  if (dictionaryEntry?.field && !details.some((detail) => detail.field === dictionaryEntry.field)) {
    normalized.details = [...details, { field: dictionaryEntry.field, message }];
  }

  return normalized;
}

export async function safeSdkCall<T>(promise: Promise<T>, fallbackMessage?: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    throw normalizeApiError(error, fallbackMessage);
  }
}

export function createFieldErrorMap(details: ApiErrorDetail[]): Record<string, string> {
  return details.reduce<Record<string, string>>((acc, detail) => {
    if (detail.field && !acc[detail.field]) {
      acc[detail.field] = detail.message;
    }
    return acc;
  }, {});
}
