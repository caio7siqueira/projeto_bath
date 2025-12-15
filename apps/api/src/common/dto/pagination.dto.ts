import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field and direction, e.g., "createdAt:desc"',
    example: 'createdAt:desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  /**
   * Converte os parâmetros de paginação para formato Prisma
   * @returns { skip, take, orderBy }
   */
  toPrisma() {
    const skip = ((this.page || 1) - 1) * (this.pageSize || 20);
    const take = this.pageSize || 20;

    let orderBy: any = undefined;
    if (this.sort) {
      const [field, direction] = this.sort.split(':');
      if (field && (direction === 'asc' || direction === 'desc')) {
        orderBy = { [field]: direction };
      }
    }

    return { skip, take, orderBy };
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
