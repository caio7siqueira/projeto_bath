import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const STATUSES = ['SCHEDULED', 'SENT', 'ERROR', 'CANCELLED'] as const;
export type NotificationJobStatus = typeof STATUSES[number];

export class ListNotificationJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra jobs por status', enum: STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(STATUSES as unknown as string[])
  status?: NotificationJobStatus;
}
