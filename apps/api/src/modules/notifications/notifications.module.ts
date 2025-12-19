import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsQueueService } from './notifications.queue';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationJobService } from './notification-job.service';
import { NotificationJobController } from './notification-job.controller';


@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController, NotificationJobController],
  providers: [NotificationsService, NotificationJobService, NotificationsQueueService],
  exports: [NotificationsService, NotificationsQueueService],
})
export class NotificationsModule {}
