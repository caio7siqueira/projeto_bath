import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, ListAppointmentsDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos (startsAt >= endsAt ou duração < 5min)' })
  @ApiResponse({ status: 404, description: 'Cliente ou localização não encontrados' })
  @ApiResponse({ status: 409, description: 'Conflito: overlap com outro agendamento' })
  async create(
    @TenantUser('tenantId') tenantId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos com filtros opcionais' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos (array ou paginated response)' })
  async findAll(
    @TenantUser('tenantId') tenantId: string,
    @Query() filters: ListAppointmentsDto,
  ) {
    return this.appointmentsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async findOne(
    @Param('id') id: string,
    @TenantUser('tenantId') tenantId: string,
  ) {
    return this.appointmentsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito: overlap com outro agendamento' })
  async update(
    @Param('id') id: string,
    @TenantUser('tenantId') tenantId: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, tenantId, dto);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancelar agendamento (idempotente)' })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async cancel(
    @Param('id') id: string,
    @TenantUser('tenantId') tenantId: string,
  ) {
    return this.appointmentsService.cancel(id, tenantId);
  }
}
