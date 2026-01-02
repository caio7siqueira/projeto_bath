import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'ERR_BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'ERR_UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'ERR_FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'ERR_NOT_FOUND',
  [HttpStatus.CONFLICT]: 'ERR_CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'ERR_UNPROCESSABLE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'ERR_RATE_LIMITED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'ERR_INTERNAL',
};

const DEFAULT_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Requisição inválida. Confira os campos enviados.',
  [HttpStatus.UNAUTHORIZED]: 'Credenciais inválidas ou sessão expirada.',
  [HttpStatus.FORBIDDEN]: 'Você não possui permissão para acessar este recurso.',
  [HttpStatus.NOT_FOUND]: 'O recurso solicitado não foi encontrado.',
  [HttpStatus.CONFLICT]: 'Já existe um registro com os mesmos dados.',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Não foi possível processar os dados enviados.',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Muitas tentativas em sequência. Aguarde antes de tentar novamente.',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno ao processar a requisição.',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const headerRequestId = request.headers?.['x-request-id'];
    const normalizedHeaderId = Array.isArray(headerRequestId)
      ? headerRequestId[0]
      : headerRequestId;
    const requestId = normalizedHeaderId ?? (request as Record<string, any>).id;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const normalized = this.normalizeHttpException(status, exceptionResponse, exception);
      return this.reply(response, request, normalized, requestId, exception);
    }

    if (this.isPrismaError(exception)) {
      const normalized = this.normalizePrismaError(
        exception as Prisma.PrismaClientKnownRequestError,
      );
      return this.reply(response, request, normalized, requestId, exception as Error);
    }

    const normalized: NormalizedError = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'ERR_INTERNAL',
      message: DEFAULT_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR],
    };

    return this.reply(response, request, normalized, requestId, exception as Error);
  }

  private normalizeHttpException(
    status: number,
    payload: string | Record<string, any>,
    exception: HttpException,
  ): NormalizedError {
    const responsePayload =
      typeof payload === 'string'
        ? { message: payload }
        : (payload as Record<string, unknown>);

    const message = this.extractMessage(responsePayload, exception.message, status);
    const code = this.extractCode(responsePayload, status);
    const details = this.extractDetails(responsePayload);

    return {
      status,
      code,
      message,
      details,
    };
  }

  private normalizePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): NormalizedError {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[]) || [];
        return {
          status: HttpStatus.CONFLICT,
          code: 'ERR_DUPLICATE_VALUE',
          message: 'Já existe um registro com os mesmos dados.',
          details: { campos: target },
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'ERR_NOT_FOUND',
          message: 'Registro não encontrado.',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'ERR_INVALID_REFERENCE',
          message: 'Referência inválida para relacionamento.',
          details: { campo: error.meta?.field_name },
        };
      case 'P2014':
      case 'P2011':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'ERR_REQUIRED_FIELD',
          message: 'Campo obrigatório ausente ou inválido.',
        };
      case 'P2000':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'ERR_FIELD_TOO_LONG',
          message: 'Valor muito longo para o campo informado.',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'ERR_DATABASE_OPERATION',
          message: 'Falha ao executar operação no banco de dados.',
          details: { motivo: error.message },
        };
    }
  }

  private extractMessage(
    payload: Record<string, unknown> | undefined,
    fallback: string,
    status: number,
  ): string {
    if (payload?.message && typeof payload.message === 'string') {
      return payload.message as string;
    }

    if (Array.isArray(payload?.message) && payload?.message.length) {
      return 'Há erros de validação nos campos enviados.';
    }

    if (typeof fallback === 'string' && fallback.length > 0) {
      return fallback;
    }

    return DEFAULT_MESSAGES[status] ?? DEFAULT_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR];
  }

  private extractDetails(payload: Record<string, unknown> | undefined) {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const details: Record<string, unknown> = {};

    if (Array.isArray(payload.message) && payload.message.length) {
      details.fields = payload.message;
    }

    if (payload.details && typeof payload.details === 'object') {
      details.meta = payload.details;
    }

    if (payload.error && typeof payload.error === 'string') {
      details.causa = payload.error;
    }

    return Object.keys(details).length ? details : undefined;
  }

  private extractCode(payload: Record<string, unknown> | undefined, status: number) {
    if (payload?.code && typeof payload.code === 'string') {
      return payload.code;
    }
    return STATUS_CODE_MAP[status] ?? 'ERR_INTERNAL';
  }

  private isPrismaError(exception: unknown): exception is Prisma.PrismaClientKnownRequestError {
    return exception instanceof Prisma.PrismaClientKnownRequestError;
  }

  private reply(
    response: Response,
    request: Request,
    error: NormalizedError,
    requestId?: string,
    exception?: unknown,
  ) {
    const details = this.mergeDetails(error.details, {
      requestId,
      path: request.url,
      method: request.method,
    });

    const body = {
      code: error.code,
      message: error.message,
      ...(details ? { details } : {}),
    };

    const logMessage = `${request.method} ${request.url} - ${error.status} - ${error.code}`;
    if (error.status >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
        `[${requestId ?? 'sem-request-id'}]`,
      );
    } else {
      this.logger.warn(`${logMessage} [${requestId ?? 'sem-request-id'}]`);
    }

    return response.status(error.status).json(body);
  }

  private mergeDetails(
    base: Record<string, unknown> | undefined,
    extras: Record<string, unknown>,
  ) {
    const merged = { ...(base ?? {}), ...extras };
    Object.keys(merged).forEach((key) => {
      if (merged[key] === undefined || merged[key] === null) {
        delete merged[key];
      }
    });
    return Object.keys(merged).length ? merged : undefined;
  }
}