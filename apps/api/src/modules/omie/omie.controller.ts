import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OmieService } from './omie.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations/omie')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class OmieController {
  constructor(private readonly omieService: OmieService) {}

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
