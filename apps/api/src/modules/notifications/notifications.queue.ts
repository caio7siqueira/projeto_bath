import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export interface EnqueueSmsOptions {
  tenantId: string;
  to: string;
  message: string;
  delayMs?: number;
  appointmentId?: string;
  notificationJobId: string;
}

@Injectable()
export class NotificationsQueueService {
  private readonly logger = new Logger(NotificationsQueueService.name);
  private connection: IORedis;
  private notificationsQueue: Queue;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set; notifications queue will fail to enqueue');
    } else {
      this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
      this.notificationsQueue = new Queue('notifications', { connection: this.connection });
    }
  }

  async enqueueSms(opts: EnqueueSmsOptions) {
    if (!this.notificationsQueue) {
      throw new Error('Notifications queue not initialized');
    }

    const delay = Math.max(0, opts.delayMs || 0);

    const job = await this.notificationsQueue.add(
      'sms-reminder',
      {
        type: 'SMS',
        to: opts.to,
        message: opts.message,
        appointmentId: opts.appointmentId,
        tenantId: opts.tenantId,
        notificationJobId: opts.notificationJobId,
      },
      {
        delay,
        attempts: 5,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: 1000,
        removeOnFail: false,
      }
    );

    return job.id;
  }

  async removeJob(jobId: string) {
    if (!this.notificationsQueue) throw new Error('Notifications queue not initialized');
    await this.notificationsQueue.remove(jobId);
  }
}
