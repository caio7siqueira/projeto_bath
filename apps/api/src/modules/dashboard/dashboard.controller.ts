import { BadRequestException, Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly service: DashboardService) {}

  @Get('reports')
  @ApiOperation({ summary: 'Get dashboard summary with totals' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'SUPER_ADMIN')
  async getReports(@TenantUser('tenantId') tenantId?: string) {
    let effectiveTenantId = tenantId;
    if (process.env.NODE_ENV === 'development' && !tenantId) {
      effectiveTenantId = 'dev-tenant';
    }

    if (!effectiveTenantId) {
      this.logger.warn('Requisição a /v1/dashboard/reports sem tenantId definida');
      throw new BadRequestException('tenantId é obrigatório para carregar os relatórios do dashboard.');
    }

    return this.service.getReports(effectiveTenantId);
  }
}
