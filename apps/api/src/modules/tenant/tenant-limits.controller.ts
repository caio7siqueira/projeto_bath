import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TenantLimitsService } from './tenant-limits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('v1/tenant')
@UseGuards(JwtAuthGuard)
export class TenantLimitsController {
  constructor(private readonly service: TenantLimitsService) {}

  @Get('limits')
  getLimits(@Req() req: any) {
    return this.service.getLimits(req.user.tenantId);
  }

  @Get('usage')
  getUsage(@Req() req: any) {
    return this.service.getUsage(req.user.tenantId);
  }
}
