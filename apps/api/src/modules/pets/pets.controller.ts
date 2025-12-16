import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
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
