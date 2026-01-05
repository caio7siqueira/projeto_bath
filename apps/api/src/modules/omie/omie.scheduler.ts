import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { OmieQueueService } from './omie.queue';
import { OMIE_MAX_AUTOMATIC_ATTEMPTS, OMIE_RETRY_WINDOW_MINUTES } from './omie.constants';

@Injectable()
export class OmieScheduler {
  private readonly logger = new Logger(OmieScheduler.name);

  constructor(private readonly prisma: PrismaService, private readonly omieQueue: OmieQueueService) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'omie-requeue-stale-events' })
  async requeueStaleEvents() {
    const cutoff = new Date(Date.now() - OMIE_RETRY_WINDOW_MINUTES * 60 * 1000);

    const staleEvents = await this.prisma.omieSalesEvent.findMany({
      where: {
        status: { in: ['PENDING', 'ERROR'] },
        attemptCount: { lt: OMIE_MAX_AUTOMATIC_ATTEMPTS },
        OR: [{ lastAttemptAt: null }, { lastAttemptAt: { lt: cutoff } }],
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    if (!staleEvents.length) {
      return;
    }

    this.logger.debug(`Re-enqueuing ${staleEvents.length} Omie events`);

    await Promise.all(
      staleEvents.map(async (event) => {
        try {
          await this.omieQueue.enqueueProcessEvent(event.id);
        } catch (error) {
          const err = error as Error;
          this.logger.error(`Failed to re-enqueue OmieSalesEvent ${event.id}: ${err.message}`, err.stack);
        }
      }),
    );
  }
}
