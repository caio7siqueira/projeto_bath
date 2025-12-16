import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsISO8601, IsString, IsEnum } from 'class-validator';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  DONE = 'DONE',
  RESCHEDULED = 'RESCHEDULED',
  NO_SHOW = 'NO_SHOW',
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'ISO 8601 timestamp' })
  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 timestamp' })
  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
