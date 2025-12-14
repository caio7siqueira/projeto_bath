import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })] })
class WorkerModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const connection = new IORedis(redisUrl);

  new Queue('omie', { connection });
  new Queue('notifications', { connection });
  new Queue('recurrence', { connection });

  new Worker(
    'omie',
    async (job) => {
      // eslint-disable-next-line no-console
      console.log('Omie job', job.id, job.data);
    },
    { connection }
  );
  new Worker(
    'notifications',
    async (job) => {
      // eslint-disable-next-line no-console
      console.log('Notifications job', job.id, job.data);
    },
    { connection }
  );
  new Worker(
    'recurrence',
    async (job) => {
      // eslint-disable-next-line no-console
      console.log('Recurrence job', job.id, job.data);
    },
    { connection }
  );

  // eslint-disable-next-line no-console
  console.log('Worker started. Queues: omie, notifications, recurrence');
  await app.close();
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Worker bootstrap failed', e);
  process.exit(1);
});
