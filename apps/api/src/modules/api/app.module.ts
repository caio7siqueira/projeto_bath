import { Module } from '@nestjs/common';
import { BillingModule } from './billing/billing.module';
import { SuperadminBillingModule } from './superadmin/billing/superadmin-billing.module';

@Module({
  imports: [
    BillingModule,
    SuperadminBillingModule,
  ],
})
export class AppModule {}