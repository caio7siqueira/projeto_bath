import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { NotificationJobService } from './notification-job.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('v1/notification-job')
@UseGuards(JwtAuthGuard)
export class NotificationJobController {
  constructor(private readonly service: NotificationJobService) {}

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.service.createJob({
      tenant_id: req.user.tenantId,
      appointment_id: body.appointment_id,
      // channel: body.channel, // campo não existe
      // type: body.type, // campo não existe
      to: body.to,
    });
  }
}
