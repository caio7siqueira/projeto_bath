import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiProperty({ example: true, description: 'Ativar/desativar tenant' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
