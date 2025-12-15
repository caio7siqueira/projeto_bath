import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { TwilioProvider } from '../../../src/integrations/twilio.provider';
import { InMemorySmsProvider } from './in-memory-sms';

export async function bootstrapApp(overrides?: { sms?: InMemorySmsProvider }) {
  const sms = overrides?.sms ?? new InMemorySmsProvider();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(TwilioProvider)
    .useValue(sms)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, sms } as { app: INestApplication; sms: InMemorySmsProvider };
}
