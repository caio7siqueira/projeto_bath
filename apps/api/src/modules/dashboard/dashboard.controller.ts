import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantUser } from '@/common/decorators/tenant-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('reports')
  @ApiOperation({ summary: 'Get dashboard summary with totals' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getReports(@TenantUser('tenantId') tenantId: string) {
    return this.service.getReports(tenantId);
  }
}
