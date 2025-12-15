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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  @RequireRole('ADMIN')
  @ApiOperation({ summary: 'Criar novo tenant (ADMIN)' })
  async create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequireRole('ADMIN')
  @ApiOperation({ summary: 'Listar todos os tenants (ADMIN)' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RequireRole('ADMIN')
  @ApiOperation({ summary: 'Obter tenant por ID (ADMIN)' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @RequireRole('ADMIN')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atualizar tenant (ADMIN)' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(id, dto);
  }
}
