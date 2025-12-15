import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Petshop Central', description: 'Nome do tenant' })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({ example: 'petshop-central', description: 'Slug único (lowercase, sem espaços)' })
  @IsString()
  @Matches(/^[a-z0-9\-]+$/, { message: 'Slug deve conter apenas letras, números e hífens' })
  slug!: string;
}
