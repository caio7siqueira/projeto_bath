import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { SuperadminBillingService } from './superadmin-billing.service';
// import { JwtSuperadminGuard } from '../../common/guards/jwt-superadmin.guard';
// import { ModeLeituraInterceptor } from '../../../billing/mode-leitura.interceptor';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

@Controller('v1/superadmin/billing/subscriptions')
// @UseGuards(JwtSuperadminGuard)
// @UseInterceptors(ModeLeituraInterceptor)
export class SuperadminBillingController {
  constructor(private readonly service: SuperadminBillingService) {}

  @Get()
  listSubscriptions(@Query() query: PaginationQueryDto) {
    return this.service.listSubscriptions(query);
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
