import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional } from 'class-validator';

type Granularity = 'day' | 'month';

export class AppointmentsTimeseriesDto {
  @ApiPropertyOptional({ description: 'Data inicial ISO 8601 (inclusive)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Data final ISO 8601 (inclusive)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: ['day', 'month'], default: 'day' })
  @IsOptional()
  @IsIn(['day', 'month'])
  granularity?: Granularity;
}
