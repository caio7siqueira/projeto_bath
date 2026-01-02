import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';
import { expectData, expectError, expectList, expectMeta } from './support/http-assertions';

/**
 * Appointments E2E
 * - Usa Testcontainers (startEnv) + bootstrapApp com URLs injetadas
 * - Prefixo /v1
 */

describe('Appointments (E2E)', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let adminToken: string;
  let tenantId: string;
  let locationId: string;
  let customerId: string;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp({ databaseUrl: env.databaseUrl, redisUrl: env.redisUrl });
    app = boot.app;

    // Cria admin (tenant base efizion-bath-demo)
    const adminEmail = `admin_${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'StrongPass123!',
        name: 'Admin User',
        role: 'ADMIN',
        tenantSlug: 'efizion-bath-demo',
      })
      .expect(201);
    const registerData = expectData(registerRes);
    adminToken = registerData.accessToken;
    tenantId = registerData.user.tenantId;

    // Cria location
    const locRes = await request(app.getHttpServer())
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sala A' })
      .expect(201);
    locationId = expectData(locRes).id;

    // Cria customer
    const custRes = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Doe', phone: `+55119${Date.now().toString().slice(-8)}` })
      .expect(201);
    customerId = expectData(custRes).id;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (stopEnv) await stopEnv();
  });

  describe('POST /v1/appointments', () => {
    it('deve criar appointment com sucesso', async () => {
      const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt, endsAt, notes: 'Primeiro agendamento' })
        .expect(201);
      const appointment = expectData(res);
      expect(appointment).toMatchObject({
        id: expect.any(String),
        tenantId,
        customerId,
        locationId,
        status: 'SCHEDULED',
        notes: 'Primeiro agendamento',
      });
    });

    it('deve retornar 400 se startsAt >= endsAt', async () => {
      const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(400);
      expectError(res, 'ERR_BAD_REQUEST');
    });

    it('deve retornar 400 se duração < 5 minutos', async () => {
      const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 60 * 60 * 1000 + 4 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(400);
      expectError(res, 'ERR_BAD_REQUEST');
    });

    it('deve retornar 409 em caso de overlap', async () => {
      const base = Date.now() + 3 * 60 * 60 * 1000;
      const aStart = new Date(base).toISOString();
      const aEnd = new Date(base + 60 * 60 * 1000).toISOString();
      await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt: aStart, endsAt: aEnd })
        .expect(201);

      const overlapStart = new Date(base + 30 * 60 * 1000).toISOString();
      const overlapEnd = new Date(base + 90 * 60 * 1000).toISOString();
      const overlapRes = await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt: overlapStart, endsAt: overlapEnd })
        .expect(409);
      expectError(overlapRes, 'ERR_CONFLICT');
    });
  });

  describe('GET /v1/appointments', () => {
    it('deve listar appointments sem paginação (array)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const items = expectList(res);
      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('id');
        expect(items[0]).toHaveProperty('status');
      }
    });

    it('deve listar com paginação', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/appointments?page=1&pageSize=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const items = expectList(res);
      const meta = expectMeta(res);
      expect(meta.page).toBe(1);
      expect(meta.pageSize).toBe(5);
      expect(meta.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(items)).toBe(true);
    });

    it('deve filtrar por locationId e período', async () => {
      const from = new Date(Date.now()).toISOString();
      const to = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .get(`/v1/appointments?locationId=${locationId}&from=${from}&to=${to}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const items = expectList(res);
      items.forEach(item => expect(item.locationId).toBe(locationId));
    });
  });

  describe('GET /v1/appointments/:id e PATCH /cancel', () => {
    it('deve obter por ID, atualizar notes e cancelar idempotente', async () => {
      const startsAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString();
      const create = await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(201);
      const created = expectData(create);
      const id = created.id;

      const byId = await request(app.getHttpServer())
        .get(`/v1/appointments/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(expectData(byId).id).toBe(id);

      const updated = await request(app.getHttpServer())
        .patch(`/v1/appointments/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Atualizado via teste' })
        .expect(200);
      expect(expectData(updated).notes).toBe('Atualizado via teste');

      const cancelled1 = await request(app.getHttpServer())
        .post(`/v1/appointments/${id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const cancelledData1 = expectData(cancelled1);
      expect(cancelledData1.status).toBe('CANCELLED');

      const cancelled2 = await request(app.getHttpServer())
        .post(`/v1/appointments/${id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const cancelledData2 = expectData(cancelled2);
      expect(cancelledData2.status).toBe('CANCELLED');
      expect(cancelledData2.cancelledAt).toBe(cancelledData1.cancelledAt);
    });
  });

  describe('Isolamento multi-tenant', () => {
    it('não deve permitir acessar appointment de outro tenant', async () => {
      // Cria outro tenant e um admin nesse tenant
      const tenantSlug = `tenant-${Date.now()}`;
      await request(app.getHttpServer())
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Tenant 2', slug: tenantSlug })
        .expect(201);

      const otherEmail = `admin2_${Date.now()}@example.com`;
      const reg2 = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: otherEmail,
          password: 'StrongPass123!',
          name: 'Admin 2',
          role: 'ADMIN',
          tenantSlug,
        })
        .expect(201);
      const reg2Data = expectData(reg2);
      const token2 = reg2Data.accessToken;

      // Cria appointment no tenant 1
      const startsAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();
      const create = await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(201);
      const created = expectData(create);

      // Tenta buscar no outro tenant
      const forbiddenRes = await request(app.getHttpServer())
        .get(`/v1/appointments/${created.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);
      expectError(forbiddenRes, 'ERR_NOT_FOUND');
    });
  });
});
