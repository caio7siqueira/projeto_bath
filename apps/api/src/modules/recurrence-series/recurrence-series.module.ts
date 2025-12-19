import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RecurrenceSeriesController } from './recurrence-series.controller';
import { RecurrenceSeriesService } from './recurrence-series.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecurrenceSeriesController],
  providers: [RecurrenceSeriesService],
  exports: [RecurrenceSeriesService],
})
export class RecurrenceSeriesModule {}
