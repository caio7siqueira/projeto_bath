import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

enum LifeStatus {
  ALIVE = 'ALIVE',
  DECEASED = 'DECEASED',
}

export class UpdatePetDto {
  @ApiPropertyOptional({ example: 'Rex' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: LifeStatus, example: LifeStatus.DECEASED })
  @IsOptional()
  @IsEnum(LifeStatus)
  lifeStatus?: LifeStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allowNotifications?: boolean;
}
