import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { $Enums } from '@prisma/client';

export class CreatePetDto {
  @ApiProperty({ example: 'Rex' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: $Enums.Species, example: $Enums.Species.DOG })
  @IsEnum($Enums.Species)
  species!: $Enums.Species;

  @ApiPropertyOptional({ enum: $Enums.LifeStatus, example: $Enums.LifeStatus.ALIVE })
  @IsOptional()
  @IsEnum($Enums.LifeStatus)
  lifeStatus?: $Enums.LifeStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowNotifications?: boolean;
}
