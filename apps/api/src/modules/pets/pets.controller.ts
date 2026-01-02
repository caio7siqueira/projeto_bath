import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { ListPetsQueryDto } from './dto/list-pets.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';


@ApiTags('pets')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class PetsController {
  constructor(private readonly service: PetsService) {}

  @Get('pets')
  @ApiOperation({ summary: 'Listar todos os pets do tenant (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de pets' })
  async listAll(
    @TenantUser('tenantId') tenantId: string,
    @Query() query: ListPetsQueryDto,
  ) {
    return this.service.listAll(tenantId, query);
  }

  @Get('customers/:customerId/pets')
  @ApiOperation({ summary: 'Listar pets de um customer' })
  @ApiResponse({ status: 200, description: 'Lista de pets' })
  async list(
    @TenantUser('tenantId') tenantId: string,
    @Param('customerId') customerId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.listByCustomer(tenantId, customerId, query);
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

  @Post('pets/:petId/mark-deceased')
  @ApiOperation({ summary: 'Marcar pet como falecido' })
  @ApiResponse({ status: 200, description: 'Pet marcado como falecido' })
  @ApiResponse({ status: 404, description: 'Pet não encontrado' })
  @ApiResponse({ status: 422, description: 'Pet já está falecido' })
  async markDeceased(
    @TenantUser('tenantId') tenantId: string,
    @Param('petId') petId: string,
  ) {
    throw new Error('Método markDeceased não implementado em PetsService');
  }
}
