import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OmieService } from './omie.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
import {
  ListOmieEventsQueryDto,
  TestOmieConnectionDto,
  UpsertOmieConnectionDto,
} from './dto/omie-connection.dto';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations/omie')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class OmieController {
  constructor(private readonly omieService: OmieService) {}

  @Get('connection')
  @ApiOperation({ summary: 'Exibir status da conexão Omie (ADMIN)' })
  async getConnection(@TenantUser('tenantId') tenantId: string) {
    return this.omieService.getConnectionStatus(tenantId);
  }

  @Put('connection')
  @ApiOperation({ summary: 'Atualizar credenciais Omie (ADMIN)' })
  async upsertConnection(
    @TenantUser('tenantId') tenantId: string,
    @Body() body: UpsertOmieConnectionDto,
  ) {
    return this.omieService.upsertConnection(tenantId, body);
  }

  @Post('connection/test')
  @ApiOperation({ summary: 'Testar credenciais Omie (ADMIN)' })
  async testConnection(
    @TenantUser('tenantId') tenantId: string,
    @Body() body: TestOmieConnectionDto,
  ) {
    return this.omieService.testConnection(tenantId, body);
  }

  @Get('events')
  @ApiOperation({ summary: 'Listar eventos Omie por tenant (ADMIN)' })
  async listEvents(
    @TenantUser('tenantId') tenantId: string,
    @Query() query: ListOmieEventsQueryDto,
  ) {
    return this.omieService.listEvents(tenantId, query);
  }

  @Post('reprocess/:eventId')
  @ApiOperation({ summary: 'Reprocessar evento Omie com erro (ADMIN)' })
  async reprocessEvent(@Param('eventId') eventId: string) {
    await this.omieService.reprocessFailedEvent(eventId);
    return { message: 'Event queued for reprocessing' };
  }

  @Post('/internal/process/:eventId')
  @ApiOperation({ summary: 'Processar evento Omie (chamado pelo worker)' })
  async processEvent(@Param('eventId') eventId: string) {
    await this.omieService.processOmieSalesEvent(eventId);
    return { message: 'Event processed' };
  }
}
