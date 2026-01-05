import { Module } from '@nestjs/common';
import { OmieService } from './omie.service';
import { OmieController } from './omie.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OmieQueueService } from './omie.queue';
import { OmieScheduler } from './omie.scheduler';

@Module({
  imports: [PrismaModule],
  controllers: [OmieController],
  providers: [OmieService, OmieQueueService, OmieScheduler],
  exports: [OmieService, OmieQueueService],
})
export class OmieModule {}
