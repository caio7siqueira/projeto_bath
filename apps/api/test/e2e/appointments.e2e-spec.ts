import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';

describe('Appointments (E2E)', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let prisma: PrismaClient;
  let accessToken: string;
  let tenantId: string;
  let customerId: string;
  let locationId: string;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp({
      databaseUrl: env.databaseUrl,
      redisUrl: env.redisUrl,
    });
    app = boot.app;
    prisma = new PrismaClient({
      datasources: { db: { url: env.databaseUrl } },
    });

    // Setup inicial: cria tenant, location, customer
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'appointments@test.com',
        password: 'Test@1234',
        name: 'Appointments Test Admin',
        phone: '+5511999999999',
        tenantName: 'Appointments Test Tenant',
      })
      .expect(201);

    accessToken = registerRes.body.accessToken;
    tenantId = registerRes.body.user.tenantId;

    // Criar location
    const locationRes = await request(app.getHttpServer())
      .post('/locations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Location Test',
        address: 'Rua Teste, 123',
        phone: '+5511988888888',
      })
      .expect(201);

    locationId = locationRes.body.id;

    // Criar customer
    const customerRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Customer Test',
        email: 'customer@test.com',
        phone: '+5511977777777',
      })
      .expect(201);

    customerId = customerRes.body.id;
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (app) await app.close();
    if (stopEnv) await stopEnv();
  });

  describe('POST /appointments', () => {
    it('deve criar appointment com sucesso', async () => {
      const startsAt = new Date(Date.now() + 86400000).toISOString(); // amanhã
      const endsAt = new Date(Date.now() + 86400000 + 3600000).toISOString(); // amanhã + 1h

      const res = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          locationId,
          startsAt,
          endsAt,
          notes: 'Cliente preferiu horário da manhã',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        tenantId,
        customerId,
        locationId,
        status: 'SCHEDULED',
        notes: 'Cliente preferiu horário da manhã',
      });
      expect(res.body.startsAt).toBe(startsAt);
      expect(res.body.endsAt).toBe(endsAt);
    });

    it('deve retornar 400 se startsAt >= endsAt', async () => {
      const startsAt = new Date(Date.now() + 86400000).toISOString();
      const endsAt = new Date(Date.now() + 86400000 - 3600000).toISOString(); // antes de startsAt

      await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          locationId,
          startsAt,
          endsAt,
        })
        .expect(400);
    });

    it('deve retornar 400 se duração < 5 minutos', async () => {
      const startsAt = new Date(Date.now() + 86400000).toISOString();
      const endsAt = new Date(Date.now() + 86400000 + 240000).toISOString(); // +4 min

      await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          locationId,
          startsAt,
          endsAt,
        })
        .expect(400);
    });

    it('deve retornar 409 em caso de overlap', async () => {
      const startsAt = new Date(Date.now() + 172800000).toISOString(); // daqui a 2 dias
      const endsAt = new Date(Date.now() + 172800000 + 3600000).toISOString(); // +1h

      // Criar primeiro appointment
      await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          locationId,
          startsAt,
          endsAt,
        })
        .expect(201);

      // Tentar criar appointment com overlap
      const overlapStart = new Date(Date.now() + 172800000 + 1800000).toISOString(); // +30 min
      const overlapEnd = new Date(Date.now() + 172800000 + 5400000).toISOString(); // +1.5h

      await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          locationId,
          startsAt: overlapStart,
          endsAt: overlapEnd,
        })
        .expect(409);
    });
  });

  describe('GET /appointments', () => {
    it('deve listar appointments sem paginação (retorna array)', async () => {
      const res = await request(app.getHttpServer())
        .get('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('status');
    });

    it('deve listar com paginação', async () => {
      const res = await request(app.getHttpServer())
        .get('/appointments?page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('pageSize', 10);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deve filtrar por locationId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/appointments?locationId=${locationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((appointment: any) => {
        expect(appointment.locationId).toBe(locationId);
      });
    });

    it('deve filtrar por período (from/to)', async () => {
      const from = new Date(Date.now() + 86400000).toISOString();
      const to = new Date(Date.now() + 259200000).toISOString(); // +3 dias

      const res = await request(app.getHttpServer())
        .get(`/appointments?from=${from}&to=${to}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /appointments/:id', () => {
    it('deve retornar appointment por ID', async () => {
      const startsAt = new Date(Date.now() + 345600000).toISOString(); // +4 dias
      const endsAt = new Date(Date.now() + 345600000 + 3600000).toISOString();

      const createRes = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          locationId,
          startsAt,
          endsAt,
        })
        .expect(201);

      const appointmentId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .get(`/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(appointmentId);
      expect(res.body.status).toBe('SCHEDULED');
    });

    it('deve retornar 404 se appointment não existe', async () => {
      await request(app.getHttpServer())
        .get('/appointments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /appointments/:id', () => {
    it('deve atualizar notes', async () => {
      const startsAt = new Date(Date.now() + 432000000).toISOString(); // +5 dias
      const endsAt = new Date(Date.now() + 432000000 + 3600000).toISOString();

      const createRes = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          locationId,
          startsAt,
          endsAt,
        })
        .expect(201);

      const appointmentId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .patch(`/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notes: 'Atualizado com observação importante',
        })
        .expect(200);

      expect(res.body.notes).toBe('Atualizado com observação importante');
    });

    it('deve retornar 409 ao tentar atualizar horário com overlap', async () => {
      // Criar dois appointments não conflitantes
      const starts1 = new Date(Date.now() + 518400000).toISOString(); // +6 dias
      const ends1 = new Date(Date.now() + 518400000 + 3600000).toISOString();

      const starts2 = new Date(Date.now() + 518400000 + 7200000).toISOString(); // +6 dias +2h
      const ends2 = new Date(Date.now() + 518400000 + 10800000).toISOString();

      await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customerId, locationId, startsAt: starts1, endsAt: ends1 })
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customerId, locationId, startsAt: starts2, endsAt: ends2 })
        .expect(201);

      // Tentar mover o segundo para conflitar com o primeiro
      await request(app.getHttpServer())
        .patch(`/appointments/${res2.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ startsAt: starts1 })
        .expect(409);
    });
  });

  describe('POST /appointments/:id/cancel', () => {
    it('deve cancelar appointment', async () => {
      const startsAt = new Date(Date.now() + 604800000).toISOString(); // +7 dias
      const endsAt = new Date(Date.now() + 604800000 + 3600000).toISOString();

      const createRes = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(201);

      const appointmentId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .post(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
      expect(res.body.cancelledAt).not.toBeNull();
    });

    it('cancelamento deve ser idempotente', async () => {
      const startsAt = new Date(Date.now() + 691200000).toISOString(); // +8 dias
      const endsAt = new Date(Date.now() + 691200000 + 3600000).toISOString();

      const createRes = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(201);

      const appointmentId = createRes.body.id;

      // Primeiro cancel
      const res1 = await request(app.getHttpServer())
        .post(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Segundo cancel (idempotente)
      const res2 = await request(app.getHttpServer())
        .post(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res1.body.status).toBe('CANCELLED');
      expect(res2.body.status).toBe('CANCELLED');
      expect(res1.body.cancelledAt).toBe(res2.body.cancelledAt);
    });
  });

  describe('Isolamento multi-tenant', () => {
    it('não deve permitir acesso a appointment de outro tenant', async () => {
      // Criar segundo tenant
      const registerRes2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'tenant2@test.com',
          password: 'Test@1234',
          name: 'Tenant 2 Admin',
          phone: '+5511966666666',
          tenantName: 'Tenant 2',
        })
        .expect(201);

      const accessToken2 = registerRes2.body.accessToken;

      // Criar appointment no primeiro tenant
      const startsAt = new Date(Date.now() + 777600000).toISOString(); // +9 dias
      const endsAt = new Date(Date.now() + 777600000 + 3600000).toISOString();

      const createRes = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customerId, locationId, startsAt, endsAt })
        .expect(201);

      const appointmentId = createRes.body.id;

      // Tentar acessar do segundo tenant (deve retornar 404)
      await request(app.getHttpServer())
        .get(`/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(404);
    });
  });
});
