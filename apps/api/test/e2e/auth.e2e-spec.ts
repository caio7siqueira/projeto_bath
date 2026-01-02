import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';
import { expectData, expectError } from './support/http-assertions';

describe('Internal Auth E2E', () => {
  let stopEnv: () => Promise<void>;
  let app: any;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp({ databaseUrl: env.databaseUrl, redisUrl: env.redisUrl });
    app = boot.app;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (stopEnv) await stopEnv().catch(() => undefined);
  });

  it('register → login → refresh → logout', async () => {
    const email = `user_${Date.now()}@example.com`;

    const registerRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'StrongPass123!',
        name: 'Test User',
        role: 'ADMIN',
        tenantSlug: 'efizion-bath-demo'
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password: 'StrongPass123!', tenantSlug: 'efizion-bath-demo' })
      .expect(200);
    const { accessToken, refreshToken } = expectData(loginRes);

    // protected ping
    await request(app.getHttpServer())
      .get('/v1/protected/ping')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // refresh
    const refreshRes = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(expectData(refreshRes).accessToken).toBeDefined();

    // logout (revoke refresh)
    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);
  });

  it('RBAC 403 for non-admin', async () => {
    const email = `staff_${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'StrongPass123!',
        name: 'Staff',
        role: 'STAFF',
        tenantSlug: 'efizion-bath-demo'
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password: 'StrongPass123!' })
      .expect(200);
    const token = expectData(loginRes).accessToken;

    const forbiddenRes = await request(app.getHttpServer())
      .get('/v1/protected/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expectError(forbiddenRes, 'ERR_FORBIDDEN');
  });
});
