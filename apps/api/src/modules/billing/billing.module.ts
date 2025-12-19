import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingController } from './billing.controller';

import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { BillingProvider } from './billing.provider';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController],
  providers: [BillingService, BillingRepository, BillingProvider],
  exports: [BillingService, BillingProvider],
})
export class BillingModule {}
