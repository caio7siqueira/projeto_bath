import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreateRecurrenceSeriesDto {
  @ApiProperty({ enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM_INTERVAL'] })
  @IsString()
  rule!: string;

  @ApiPropertyOptional({ description: 'Intervalo em dias para CUSTOM_INTERVAL' })
  @IsOptional()
  @IsInt()
  interval?: number;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty()
  @IsUUID()
  locationId!: string;

  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty()
  @IsUUID()
  petId!: string;

  @ApiProperty()
  @IsUUID()
  serviceId!: string;
}
