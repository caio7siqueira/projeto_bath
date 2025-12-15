import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';
import { InMemorySmsProvider } from './support/in-memory-sms';

describe('Customer OTP E2E', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let sms: InMemorySmsProvider;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp();
    app = boot.app;
    sms = boot.sms;
    process.env.TWILIO_DISABLED = 'true';
  });

  afterAll(async () => {
    await app.close();
    await stopEnv();
  });

  it('request-otp then verify-otp issues JWT', async () => {
    const phone = '+5511999999999';
    const tenantSlug = 'efizion-bath-demo';

    await request(app.getHttpServer())
      .post('/v1/customer-auth/request-otp')
      .send({ phone, tenantSlug })
      .expect(200);

    const code = sms.lastCodeFor(phone);
    expect(code).toBeDefined();

    const verifyRes = await request(app.getHttpServer())
      .post('/v1/customer-auth/verify-otp')
      .send({ phone, tenantSlug, code })
      .expect(200);

    expect(verifyRes.body.accessToken).toBeDefined();
    expect(verifyRes.body.refreshToken).toBeDefined();
  });

  it('verify-otp fails 5x then lockout', async () => {
    const phone = '+5511888888888';
    const tenantSlug = 'efizion-bath-demo';

    await request(app.getHttpServer())
      .post('/v1/customer-auth/request-otp')
      .send({ phone, tenantSlug })
      .expect(200);

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/v1/customer-auth/verify-otp')
        .send({ phone, tenantSlug, code: '000000' })
        .expect(400);
    }

    await request(app.getHttpServer())
      .post('/v1/customer-auth/verify-otp')
      .send({ phone, tenantSlug, code: '000000' })
      .expect(400);
  });
});
