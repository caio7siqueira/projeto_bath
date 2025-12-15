import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { TwilioProvider } from '../../../src/integrations/twilio.provider';
import { InMemorySmsProvider } from './in-memory-sms';
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';
import * as path from 'path';
import { PrismaExceptionFilter } from '../../../src/common/filters/prisma-exception.filter';
import { RequestLoggingInterceptor } from '../../../src/common/interceptors/request-logging.interceptor';

type BootstrapOverrides = {
  sms?: InMemorySmsProvider;
  databaseUrl?: string;
  redisUrl?: string;
};

export async function bootstrapApp(overrides?: BootstrapOverrides) {
  if (overrides?.databaseUrl) process.env.DATABASE_URL = overrides.databaseUrl;
  if (overrides?.redisUrl) process.env.REDIS_URL = overrides.redisUrl;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set before bootstrapping the app');
  }

  // Garante que o banco do Testcontainers está migrado antes de subir a app
  const repoRoot = path.resolve(__dirname, '../../../../..');
  const schemaPath = path.join(repoRoot, 'prisma', 'schema.prisma');
  execFileSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', [
    'exec',
    'prisma',
    'migrate',
    'deploy',
    '--schema',
    schemaPath,
  ], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
  const prisma = new PrismaClient();
  const sms = overrides?.sms ?? new InMemorySmsProvider();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(TwilioProvider)
    .useValue(sms)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('v1', { exclude: ['/'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  // Garante que Tenant base existe para testes
  await prisma.tenant.upsert({
    where: { slug: 'efizion-bath-demo' },
    update: { name: 'Efizion Bath Demo' },
    create: { name: 'Efizion Bath Demo', slug: 'efizion-bath-demo' },
  });
  await app.init();
  return { app, sms } as { app: INestApplication; sms: InMemorySmsProvider };
}
