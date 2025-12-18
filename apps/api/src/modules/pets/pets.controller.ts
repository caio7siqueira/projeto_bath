import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'apps/api/src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'apps/api/src/common/guards/roles.guard';
import { Roles } from 'apps/api/src/common/decorators/roles.decorator';
import { TenantUser } from 'apps/api/src/common/decorators/tenant-user.decorator';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@ApiTags('pets')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class PetsController {
  constructor(private readonly service: PetsService) {}

  @Get('customers/:customerId/pets')
  @ApiOperation({ summary: 'Listar pets de um customer' })
  @ApiResponse({ status: 200, description: 'Lista de pets' })
  async list(
    @TenantUser('tenantId') tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.service.listByCustomer(tenantId, customerId);
  }

  @Post('customers/:customerId/pets')
  @ApiOperation({ summary: 'Criar pet para um customer' })
  @ApiResponse({ status: 201, description: 'Pet criado' })
  async create(
    @TenantUser('tenantId') tenantId: string,
    @Param('customerId') customerId: string,
    @Body() dto: CreatePetDto,
  ) {
    return this.service.create(tenantId, customerId, dto);
  }

  @Patch('pets/:petId')
  @ApiOperation({ summary: 'Atualizar pet (nome, lifeStatus, allowNotifications)' })
  @ApiResponse({ status: 200, description: 'Pet atualizado' })
  async update(
    @TenantUser('tenantId') tenantId: string,
    @Param('petId') petId: string,
    @Body() dto: UpdatePetDto,
  ) {
    return this.service.update(tenantId, petId, dto);
  }
}
