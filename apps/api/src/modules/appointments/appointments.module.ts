import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { OmieModule } from '@/modules/omie/omie.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [PrismaModule, OmieModule, NotificationsModule, BillingModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
