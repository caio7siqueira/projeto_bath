import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpsertBillingSubscriptionDto } from './dto/upsert-billing-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUser } from '../../common/decorators/tenant-user.decorator';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('admin/billing/subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Obter assinatura atual do tenant' })
  async getCurrent(@TenantUser('tenantId') tenantId: string) {
    return this.billingService.getCurrentSubscription(tenantId);
  }

  @Put()
  @ApiOperation({ summary: 'Criar nova versão da assinatura do tenant' })
  async upsert(
    @TenantUser('tenantId') tenantId: string,
    @Body() dto: UpsertBillingSubscriptionDto,
  ) {
    return this.billingService.upsertSubscription(tenantId, dto);
  }
}
