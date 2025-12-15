import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Multi-tenant guard', () => {
  let stopEnv: () => Promise<void>;
  let app: any;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp();
    app = boot.app;
  });

  afterAll(async () => {
    if (app) await app.close();
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

    const token = loginRes.body.accessToken;

    // Accessing tenant B should 403
    await request(app.getHttpServer())
      .get(`/v1/protected/tenant/${tenantB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
