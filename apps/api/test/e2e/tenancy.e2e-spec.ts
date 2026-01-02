import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';
import { PrismaClient } from '@prisma/client';
import { expectData, expectError } from './support/http-assertions';

describe('Multi-tenant guard', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp({ databaseUrl: env.databaseUrl, redisUrl: env.redisUrl });
    app = boot.app;
    prisma = new PrismaClient({ datasources: { db: { url: env.databaseUrl } } });
  });

  afterAll(async () => {
    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
    if (stopEnv) await stopEnv().catch(() => undefined);
  });

  it('denies cross-tenant access', async () => {
    // Create second tenant
    const tenantB = await prisma.tenant.create({ data: { name: 'Tenant B', slug: `tenant-b-${Date.now()}` } });

    const email = `admin_${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'StrongPass123!',
        name: 'Admin',
        role: 'ADMIN',
        tenantSlug: 'efizion-bath-demo'
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password: 'StrongPass123!' })
      .expect(200);
    const token = expectData(loginRes).accessToken;

    // Accessing tenant B should 403
    const res = await request(app.getHttpServer())
      .get(`/v1/protected/tenant/${tenantB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expectError(res, 'ERR_FORBIDDEN');
  });
});
