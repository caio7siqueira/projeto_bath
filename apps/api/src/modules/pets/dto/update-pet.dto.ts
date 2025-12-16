import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { $Enums } from '@prisma/client';

export class UpdatePetDto {
  @ApiPropertyOptional({ example: 'Rex' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: $Enums.LifeStatus, example: $Enums.LifeStatus.DECEASED })
  @IsOptional()
  @IsEnum($Enums.LifeStatus)
  lifeStatus?: $Enums.LifeStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allowNotifications?: boolean;
}
