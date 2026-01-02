import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { SuperadminService } from './superadmin.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('superadmin')
@ApiBearerAuth()
@Controller('superadmin')
@RequireRole('SUPER_ADMIN')
export class SuperadminController {
  constructor(private readonly service: SuperadminService) {}

  @Get('tenants')
  async listTenants(@Query() query: PaginationQueryDto) {
    return this.service.listTenants(query);
  }

  @Get('tenants/:id')
  async getTenant(@Param('id') id: string) {
    return this.service.getTenant(id);
  }

  @Post('tenants/:id/suspend')
  async suspendTenant(@Param('id') id: string) {
    return this.service.suspendTenant(id);
  }

  @Post('tenants/:id/activate')
  async activateTenant(@Param('id') id: string) {
    return this.service.activateTenant(id);
  }

  @Get('audit-logs')
  async getAuditLogs(@Query() query: PaginationQueryDto) {
    return this.service.getAuditLogs(query);
  }
}
