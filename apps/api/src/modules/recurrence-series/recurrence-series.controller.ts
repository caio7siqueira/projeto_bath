import { Controller, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
import { RecurrenceSeriesService } from './recurrence-series.service';
import { CreateRecurrenceSeriesDto, UpdateRecurrenceSeriesDto } from './dto';

@ApiTags('recurrence-series')
@ApiBearerAuth()
@Controller('recurrence-series')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class RecurrenceSeriesController {
  constructor(private readonly service: RecurrenceSeriesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar série de recorrência' })
  @ApiResponse({ status: 201, description: 'Recorrência criada e instâncias geradas' })
  async create(
    @TenantUser('tenantId') tenantId: string,
    @Body() dto: CreateRecurrenceSeriesDto,
  ) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar série de recorrência' })
  @ApiResponse({ status: 200, description: 'Recorrência atualizada' })
  async update(
    @TenantUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurrenceSeriesDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }
}
