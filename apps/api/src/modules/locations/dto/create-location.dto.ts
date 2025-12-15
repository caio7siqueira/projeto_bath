import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Sala de Banho A', description: 'Nome da localização' })
  @IsString()
  @MinLength(3)
  name!: string;
}
