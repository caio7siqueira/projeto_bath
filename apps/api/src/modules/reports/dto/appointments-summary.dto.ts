import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class AppointmentsSummaryDto {
  @ApiPropertyOptional({ description: 'Data inicial ISO 8601 (inclusive)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Data final ISO 8601 (inclusive)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
