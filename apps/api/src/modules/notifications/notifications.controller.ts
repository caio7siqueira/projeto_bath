import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';
import { NotificationsService } from './notifications.service';
import { ListNotificationJobsQueryDto } from './dto/list-notification-jobs.dto';

@ApiTags('notifications')
@Controller('integrations/notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('internal/mark/:id')
  @ApiOperation({ summary: 'Atualiza status de NotificationJob (chamado pelo worker)' })
  async mark(
    @Param('id') id: string,
    @Body() body: { status: 'SENT' | 'ERROR'; providerMessageId?: string; errorMessage?: string }
  ) {
    return this.service.markNotificationStatus(id, body.status, body.providerMessageId, body.errorMessage);
  }

  @Get('admin/jobs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar NotificationJobs do tenant (ADMIN)' })
  async listJobs(
    @TenantUser('tenantId') tenantId: string,
    @Query() query: ListNotificationJobsQueryDto,
  ) {
    return this.service.listJobs(tenantId, query);
  }
}
