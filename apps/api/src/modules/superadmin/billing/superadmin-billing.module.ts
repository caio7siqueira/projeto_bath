import { Module } from '@nestjs/common';
import { SuperadminBillingController } from './superadmin-billing.controller';
import { SuperadminBillingService } from './superadmin-billing.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SuperadminBillingController],
  providers: [SuperadminBillingService],
})
export class SuperadminBillingModule {}
