import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

enum Species {
  DOG = 'DOG',
  CAT = 'CAT',
}

enum LifeStatus {
  ALIVE = 'ALIVE',
  DECEASED = 'DECEASED',
}

export class CreatePetDto {
  @ApiProperty({ example: 'Rex' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: Species, example: Species.DOG })
  @IsEnum(Species)
  species!: Species;

  @ApiPropertyOptional({ enum: LifeStatus, example: LifeStatus.ALIVE })
  @IsOptional()
  @IsEnum(LifeStatus)
  lifeStatus?: LifeStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowNotifications?: boolean;
}
