import { Controller, Get, Post, Param, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { SuperadminBillingService } from './superadmin-billing.service';
// import { JwtSuperadminGuard } from '../../common/guards/jwt-superadmin.guard';
// import { ModeLeituraInterceptor } from '../../../billing/mode-leitura.interceptor';

@Controller('v1/superadmin/billing/subscriptions')
// @UseGuards(JwtSuperadminGuard)
// @UseInterceptors(ModeLeituraInterceptor)
export class SuperadminBillingController {
  constructor(private readonly service: SuperadminBillingService) {}

  @Get()
  listSubscriptions() {
    return this.service.listSubscriptions();
  }

  @Post(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.service.suspend(id);
  }

  @Post(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.service.reactivate(id);
  }
}
