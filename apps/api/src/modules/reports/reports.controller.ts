import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
import { ReportsService } from './reports.service';
import { AppointmentsSummaryDto } from './dto/appointments-summary.dto';
import { AppointmentsTimeseriesDto } from './dto/appointments-timeseries.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('appointments/summary')
  @ApiOperation({ summary: 'Resumo de agendamentos por status no período' })
  @ApiResponse({ status: 200, description: 'Contagens agregadas' })
  async getAppointmentsSummary(
    @TenantUser('tenantId') tenantId: string,
    @Query() query: AppointmentsSummaryDto,
  ) {
    return this.service.getAppointmentsSummary(tenantId, query);
  }

  @Get('appointments/timeseries')
  @ApiOperation({ summary: 'Série temporal de agendamentos (day|month)' })
  @ApiResponse({ status: 200, description: 'Lista de buckets por período' })
  async getAppointmentsTimeseries(
    @TenantUser('tenantId') tenantId: string,
    @Query() query: AppointmentsTimeseriesDto,
  ) {
    return this.service.getAppointmentsTimeseries(tenantId, query);
  }
}
