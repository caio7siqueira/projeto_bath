import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'alex@petspa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Alex Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF, description: 'Perfil de acesso do usuário' })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ description: 'ID do tenant (obrigatório apenas para SUPER_ADMIN). Para usuários globais deixe vazio.' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Senha inicial. Se omitido, geramos uma senha temporária segura.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'Envie convite ou e-mail transacional (placeholder).', default: true })
  @IsOptional()
  @IsBoolean()
  sendInvite?: boolean;
}
