import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequireRole } from '@/common/decorators/require-role.decorator';
import { TenantUser } from '@/common/decorators/tenant-user.decorator';
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './dto';

interface JwtPayload {
  tenantId: string;
  role?: string;
}

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Post()
  @RequireRole('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Criar nova localização (ADMIN/STAFF)' })
  async create(@TenantUser() user: JwtPayload, @Body() dto: CreateLocationDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar localizações do tenant' })
  async findByTenant(@TenantUser() user: JwtPayload) {
    return this.service.findByTenant(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter localização por ID' })
  async findById(@TenantUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findById(id, user.tenantId);
  }

  @Patch(':id')
  @RequireRole('ADMIN', 'STAFF')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atualizar localização (ADMIN/STAFF)' })
  async update(
    @TenantUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }
}
