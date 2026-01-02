import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginationMeta } from '../dto/pagination.dto';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(value => this.wrap(value)));
  }

  private wrap(value: any) {
    if (value instanceof StreamableFile || Buffer.isBuffer(value)) {
      return value;
    }

    if (value && typeof value === 'object') {
      if ('data' in value) {
        if (Array.isArray(value.data)) {
          return {
            data: value.data,
            meta: this.ensureMeta(value.meta, value.data.length),
          };
        }
        return { data: value.data };
      }

      if (Array.isArray(value)) {
        return {
          data: value,
          meta: this.ensureMeta(undefined, value.length),
        };
      }

      return { data: value };
    }

    if (value === undefined) {
      return { data: null };
    }

    return { data: value };
  }

  private ensureMeta(meta: PaginationMeta | undefined, length: number): PaginationMeta {
    if (meta) {
      return {
        page: meta.page ?? 1,
        pageSize: meta.pageSize ?? Math.max(length, 0),
        total: meta.total ?? length,
        totalPages: meta.totalPages ?? (meta.pageSize ? Math.ceil((meta.total ?? length) / meta.pageSize) : 1),
      };
    }

    const safeLength = typeof length === 'number' ? length : 0;
    return {
      page: 1,
      pageSize: safeLength,
      total: safeLength,
      totalPages: 1,
    };
  }
}