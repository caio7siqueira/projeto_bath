import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // Gerar ou reusar requestId
    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();
    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);

    const { method, url } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Extrair user/tenant do contexto (se autenticado)
    const user = (request as any).user;
    const userId = user?.id || undefined;
    const tenantId = user?.tenantId || undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const durationMs = Date.now() - startTime;
          this.logRequest(
            method,
            url,
            statusCode,
            durationMs,
            requestId,
            userId,
            tenantId,
            userAgent,
          );
        },
        error: (error) => {
          const statusCode = error?.status || 500;
          const durationMs = Date.now() - startTime;
          this.logRequest(
            method,
            url,
            statusCode,
            durationMs,
            requestId,
            userId,
            tenantId,
            userAgent,
            error,
          );
        },
      }),
    );
  }

  private logRequest(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
    requestId: string,
    userId?: string,
    tenantId?: string,
    userAgent?: string,
    error?: any,
  ) {
    const logData = {
      method,
      url,
      statusCode,
      durationMs,
      requestId,
      userId,
      tenantId,
      userAgent,
    };

    const message = `${method} ${url} ${statusCode} - ${durationMs}ms [${requestId}]`;

    if (error && process.env.NODE_ENV !== 'test') {
      this.logger.error(message, error.stack, JSON.stringify(logData));
    } else if (statusCode >= 500) {
      this.logger.error(message, JSON.stringify(logData));
    } else if (statusCode >= 400) {
      this.logger.warn(message, JSON.stringify(logData));
    } else {
      this.logger.log(message);
    }
  }
}
