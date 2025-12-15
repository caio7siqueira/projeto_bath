import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';

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

    adminToken = registerRes.body.accessToken;
    tenantId = registerRes.body.user.tenantId;

    // Cria location
    const locRes = await request(app.getHttpServer())
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sala A' })
      .expect(201);
    locationId = locRes.body.id;

    // Cria customer
    const custRes = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Doe', phone: `+55119${Date.now().toString().slice(-8)}` })
      .expect(201);
    customerId = custRes.body.id;
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

      expect(res.body).toMatchObject({
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

      await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(400);
    });

    it('deve retornar 400 se duração < 5 minutos', async () => {
      const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 60 * 60 * 1000 + 4 * 60 * 1000).toISOString();

      await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(400);
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
      await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt: overlapStart, endsAt: overlapEnd })
        .expect(409);
    });
  });

  describe('GET /v1/appointments', () => {
    it('deve listar appointments sem paginação (array)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('status');
      }
    });

    it('deve listar com paginação', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/appointments?page=1&pageSize=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('pageSize', 5);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deve filtrar por locationId e período', async () => {
      const from = new Date(Date.now()).toISOString();
      const to = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .get(`/v1/appointments?locationId=${locationId}&from=${from}&to=${to}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((item: any) => expect(item.locationId).toBe(locationId));
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

      const id = create.body.id;

      const byId = await request(app.getHttpServer())
        .get(`/v1/appointments/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(byId.body.id).toBe(id);

      const updated = await request(app.getHttpServer())
        .patch(`/v1/appointments/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Atualizado via teste' })
        .expect(200);
      expect(updated.body.notes).toBe('Atualizado via teste');

      const cancelled1 = await request(app.getHttpServer())
        .post(`/v1/appointments/${id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(cancelled1.body.status).toBe('CANCELLED');

      const cancelled2 = await request(app.getHttpServer())
        .post(`/v1/appointments/${id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(cancelled2.body.status).toBe('CANCELLED');
      expect(cancelled2.body.cancelledAt).toBe(cancelled1.body.cancelledAt);
    });
  });

  describe('Isolamento multi-tenant', () => {
    it('não deve permitir acessar appointment de outro tenant', async () => {
      // Cria outro admin em outro tenant
      const otherEmail = `admin2_${Date.now()}@example.com`;
      const reg2 = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: otherEmail,
          password: 'StrongPass123!',
          name: 'Admin 2',
          role: 'ADMIN',
          tenantSlug: 'efizion-bath-demo',
        })
        .expect(201);

      const token2 = reg2.body.accessToken;

      // Cria appointment no tenant 1
      const startsAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();
      const create = await request(app.getHttpServer())
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(201);

      // Tenta buscar no outro tenant
      await request(app.getHttpServer())
        .get(`/v1/appointments/${create.body.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);
    });
  });
});
