import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class OmieQueueService {
  private readonly logger = new Logger(OmieQueueService.name);
  private connection?: IORedis;
  private queue?: Queue;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (process.env.NODE_ENV === 'test') {
      this.logger.log('Omie queue disabled in test mode.');
      return;
    }
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set; omie queue will be disabled (no-op).');
      return;
    }
    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    this.connection
      .connect()
      .then(() => {
        this.queue = new Queue('omie', { connection: this.connection! });
      })
      .catch((err) => {
        this.logger.warn(`Failed to connect to Redis; disabling omie queue. ${err}`);
        this.connection = undefined;
        this.queue = undefined;
      });
  }

  async enqueueProcessEvent(eventId: string) {
    if (!this.queue) {
      this.logger.warn('Omie queue not initialized; skipping enqueue.');
      return null;
    }
    const job = await this.queue.add(
      'process-omie-event',
      { eventId },
      { attempts: 5, backoff: { type: 'exponential', delay: 60_000 }, removeOnComplete: 1000 }
    );
    return job.id;
  }
}
