import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsISO8601, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty()
  @IsUUID()
  locationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  petId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({ description: 'ISO 8601 timestamp', example: '2025-12-20T10:00:00Z' })
  @IsISO8601()
  startsAt!: string;

  @ApiProperty({ description: 'ISO 8601 timestamp', example: '2025-12-20T11:00:00Z' })
  @IsISO8601()
  endsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
