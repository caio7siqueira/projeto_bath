import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'Maria Souza' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+5511988888888' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1990-05-10' })
  @IsOptional()
  @IsString()
  birthDate?: string;
}
