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
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set; omie queue will be disabled (no-op).');
      return;
    }
    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue('omie', { connection: this.connection });
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
