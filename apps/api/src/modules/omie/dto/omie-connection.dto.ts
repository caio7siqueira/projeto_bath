import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { OMIE_EVENT_STATUSES, OmieEventStatus } from '../omie.constants';

export class UpsertOmieConnectionDto {
  @IsString()
  @IsNotEmpty()
  appKey!: string;

  @IsString()
  @IsNotEmpty()
  appSecret!: string;
}

export class TestOmieConnectionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  appKey?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  appSecret?: string;
}

export class ListOmieEventsQueryDto {
  @IsOptional()
  @IsIn(OMIE_EVENT_STATUSES)
  status?: OmieEventStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
