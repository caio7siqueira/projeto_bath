import { Controller, Get, UseGuards } from '@nestjs/common';
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
  constructor(private readonly service: DashboardService) {}

  @Get('reports')
  @ApiOperation({ summary: 'Get dashboard summary with totals' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getReports(@TenantUser('tenantId') tenantId?: string) {
    // Em DEV, ignora autenticação e tenantId
    if (process.env.NODE_ENV === 'development') {
      return this.service.getReports('dev-tenant');
    }
    if (!tenantId) {
      throw new Error('tenantId não pode ser undefined');
    }
    return this.service.getReports(tenantId);
  }
}
