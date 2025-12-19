import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt } from 'class-validator';

export class UpdateRecurrenceSeriesDto {
  @ApiPropertyOptional({ enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM_INTERVAL'] })
  @IsOptional()
  @IsString()
  rule?: string;

  @ApiPropertyOptional({ description: 'Intervalo em dias para CUSTOM_INTERVAL' })
  @IsOptional()
  @IsInt()
  interval?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
