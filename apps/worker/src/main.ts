import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as path from 'path';

const envFilePath = Array.from(
  new Set([
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', '..', '.env'),
  ])
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath,
      validate: (config: Record<string, unknown>) => {
        if (!config.REDIS_URL) {
          throw new Error('Missing environment variable: REDIS_URL');
        }
        return config;
      },
    }),
  ],
})
class WorkerModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('Missing environment variable: REDIS_URL');
  }
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

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
