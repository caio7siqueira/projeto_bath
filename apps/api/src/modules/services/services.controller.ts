import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto';
import { IsBoolean, IsOptional } from 'class-validator';

class ListServicesQuery {
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;
}

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um serviço' })
  @ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Nome já existe para este tenant' })
  create(
    @TenantUser('tenantId') tenantId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.servicesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar serviços do tenant' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  findAll(
    @TenantUser('tenantId') tenantId: string,
    @Query() query: ListServicesQuery,
  ) {
    return this.servicesService.findAll(tenantId, query.includeInactive);
  }
}
