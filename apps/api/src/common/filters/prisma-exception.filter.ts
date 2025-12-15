import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
  meta?: any;
}

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = request.headers?.['x-request-id'] as string | undefined;

    // Se já é HttpException, delegar
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;

      this.logError(status, request, message, requestId);

      return response.status(status).json({
        statusCode: status,
        error: exception.name,
        message,
        requestId,
      });
    }

    // Mapear erros Prisma conhecidos
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      'meta' in exception
    ) {
      const prismaError = exception as any;
      const { status, error, message, meta } = this.mapPrismaError(prismaError);
      this.logError(status, request, message, requestId, prismaError);

      return response.status(status).json({
        statusCode: status,
        error,
        message,
        requestId,
        meta,
      } as ErrorResponse);
    }

    // Erros Prisma não mapeados ou outros erros inesperados
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(
      `Unhandled exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      `${request.method} ${request.url} [${requestId || 'no-request-id'}]`,
    );

    return response.status(status).json({
      statusCode: status,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      requestId,
    } as ErrorResponse);
  }

  private mapPrismaError(error: any): {
    status: number;
    error: string;
    message: string;
    meta?: any;
  } {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        const field = target.length > 0 ? target[0] : 'field';
        return {
          status: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: `${field} already exists`,
          meta: { target },
        };
      }

      case 'P2025': {
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Record not found',
        };
      }

      case 'P2003': {
        // Foreign key constraint failed
        const field = (error.meta?.field_name as string) || 'relation';
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: `Invalid ${field} reference`,
        };
      }

      case 'P2014':
      case 'P2011': {
        // Required field / null constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Required field missing or null',
        };
      }

      case 'P2000': {
        // Value too long for column
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Value too long for field',
        };
      }

      default: {
        // Outros erros Prisma conhecidos mas não mapeados explicitamente
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: error.message || 'Database operation failed',
        };
      }
    }
  }

  private logError(
    status: number,
    request: any,
    message: string,
    requestId?: string,
    exception?: Error,
  ) {
    const logLevel = status >= 500 ? 'error' : 'warn';
    const logMessage = `${request.method} ${request.url} - ${status} - ${message}`;

    if (logLevel === 'error') {
      this.logger.error(
        logMessage,
        exception?.stack,
        `[${requestId || 'no-request-id'}]`,
      );
    } else {
      this.logger.warn(`${logMessage} [${requestId || 'no-request-id'}]`);
    }
  }
}
