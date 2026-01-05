import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

export class ListUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou email' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Filtrar por perfil' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filtrar apenas usuários ativos' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  onlyActive?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por tenant (SUPER_ADMIN)' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
