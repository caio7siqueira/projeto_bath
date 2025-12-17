import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as path from 'path';
import { processOmieJob } from './processors/omie.processor';
import { processNotificationJob } from './processors/notification.processor';

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

  // Criar filas
  new Queue('omie', { connection });
  new Queue('notifications', { connection });

  // Workers com processadores dedicados
  new Worker('omie', processOmieJob, {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 jobs por segundo
    },
  });

  new Worker('notifications', processNotificationJob, {
    connection,
    concurrency: 10,
    limiter: {
      max: 20,
      duration: 1000, // 20 jobs por segundo
    },
  });

  console.log('✅ Worker started successfully');
  console.log('📋 Active queues: omie, notifications');
  console.log('🔄 Ready to process jobs...');

  // Manter o processo vivo
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((e) => {
  console.error('❌ Worker bootstrap failed', e);
  process.exit(1);
});
