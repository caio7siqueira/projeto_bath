import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'apps/api/src/common/dto/pagination.dto';

export class QueryCustomersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search in name, email or phone' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by exact email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by exact phone' })
  @IsOptional()
  @IsString()
  phone?: string;
}
