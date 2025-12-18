import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'apps/api/src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'apps/api/src/common/guards/roles.guard';
import { Roles } from 'apps/api/src/common/decorators/roles.decorator';
import { TenantUser } from 'apps/api/src/common/decorators/tenant-user.decorator';
import { TenantConfigService, UpdateTenantConfigDto } from './tenant-config.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/tenant-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class TenantConfigController {
  constructor(private readonly service: TenantConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Obter configurações do tenant' })
  async get(@TenantUser('tenantId') tenantId: string) {
    return this.service.getOrCreate(tenantId);
  }

  @Put()
  @ApiOperation({ summary: 'Atualizar configurações do tenant' })
  async update(
    @TenantUser('tenantId') tenantId: string,
    @Body() body: UpdateTenantConfigDto,
  ) {
    return this.service.update(tenantId, body);
  }
}
