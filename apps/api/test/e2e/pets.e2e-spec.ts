import request from 'supertest';
import { bootstrapApp } from './support/bootstrap-app';
import { startEnv } from './support/test-env';

describe('Pets (E2E)', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let adminToken: string;
  let customerId: string;
  let otherAdminToken: string;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp({ databaseUrl: env.databaseUrl, redisUrl: env.redisUrl });
    app = boot.app;

    const adminEmail = `admin_pets_${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'StrongPass123!',
        name: 'Admin Pets',
        role: 'ADMIN',
        tenantSlug: 'efizion-bath-demo',
      })
      .expect(201);

    adminToken = registerRes.body.accessToken;

    // Cria customer base
    const custRes = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tutor Pets', phone: `+55119${Date.now().toString().slice(-8)}` })
      .expect(201);
    customerId = custRes.body.id;

    // Cria outro tenant e admin para teste de isolamento
    const tenantSlug = `tenant-${Date.now()}`;
    await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tenant Pets 2', slug: tenantSlug })
      .expect(201);

    const otherRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: `admin2_${Date.now()}@example.com`,
        password: 'StrongPass123!',
        name: 'Admin 2',
        role: 'ADMIN',
        tenantSlug,
      })
      .expect(201);
    otherAdminToken = otherRes.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (stopEnv) await stopEnv();
  });

  it('deve criar e atualizar pet com lifeStatus/allowNotifications', async () => {
    const create = await request(app.getHttpServer())
      .post(`/v1/customers/${customerId}/pets`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Rex', species: 'DOG', allowNotifications: true })
      .expect(201);

    expect(create.body).toMatchObject({
      name: 'Rex',
      species: 'DOG',
      allowNotifications: true,
      lifeStatus: 'ALIVE',
    });

    const petId = create.body.id;

    const updated = await request(app.getHttpServer())
      .patch(`/v1/pets/${petId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lifeStatus: 'DECEASED', allowNotifications: false })
      .expect(200);

    expect(updated.body.lifeStatus).toBe('DECEASED');
    expect(updated.body.allowNotifications).toBe(false);
  });

  it('não deve permitir acessar pet de outro tenant', async () => {
    const create = await request(app.getHttpServer())
      .post(`/v1/customers/${customerId}/pets`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bolt', species: 'DOG' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/v1/pets/${create.body.id}`)
      .set('Authorization', `Bearer ${otherAdminToken}`)
      .send({ name: 'Hack' })
      .expect(403);
  });
});
