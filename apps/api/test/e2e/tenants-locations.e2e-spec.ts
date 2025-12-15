import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';
import { PrismaClient } from '@prisma/client';

describe('Tenants & Locations E2E', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let prisma: PrismaClient;
  let adminToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    prisma = new PrismaClient();
    
    const boot = await bootstrapApp();
    app = boot.app;

    // Create admin user
    const registerRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'StrongPass123!',
        name: 'Admin User',
        role: 'ADMIN',
        tenantSlug: 'efizion-bath-demo',
      });

    adminToken = registerRes.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
    if (stopEnv) await stopEnv().catch(() => undefined);
  });

  describe('POST /v1/tenants', () => {
    it('deve criar novo tenant (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Petshop Central',
          slug: 'petshop-central',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Petshop Central');
      expect(res.body.slug).toBe('petshop-central');
      tenantId = res.body.id;
    });

    it('deve rejeitar slug duplicado', async () => {
      await request(app.getHttpServer())
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Petshop Duplicate',
          slug: 'petshop-central',
        })
        .expect(409);
    });
  });

  describe('GET /v1/tenants', () => {
    it('deve listar tenants (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /v1/tenants/:id', () => {
    it('deve obter tenant por ID (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(tenantId);
      expect(res.body.slug).toBe('petshop-central');
    });

    it('deve retornar 404 para ID inválido', async () => {
      await request(app.getHttpServer())
        .get('/v1/tenants/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /v1/tenants/:id', () => {
    it('deve atualizar tenant (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Petshop Central Updated',
        })
        .expect(200);

      expect(res.body.name).toBe('Petshop Central Updated');
    });

    it('deve desativar tenant', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });
  });

  describe('POST /v1/locations', () => {
    beforeAll(async () => {
      // Reativar tenant para testes de location
      await request(app.getHttpServer())
        .patch(`/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);
    });

    it('deve criar localização (STAFF)', async () => {
      // Create staff user para tenant
      const staffRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: `staff-${Date.now()}@example.com`,
          password: 'StrongPass123!',
          name: 'Staff User',
          role: 'STAFF',
          tenantSlug: 'petshop-central',
        });

      const staffToken = staffRes.body.accessToken;

      const res = await request(app.getHttpServer())
        .post('/v1/locations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Sala de Banho A',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Sala de Banho A');
      expect(res.body.tenantId).toBeDefined();
    });
  });

  describe('GET /v1/locations', () => {
    it('deve listar localizações do tenant', async () => {
      const staffRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: `staff-list-${Date.now()}@example.com`,
          password: 'StrongPass123!',
          name: 'Staff List',
          role: 'STAFF',
          tenantSlug: 'petshop-central',
        });

      const staffToken = staffRes.body.accessToken;

      const res = await request(app.getHttpServer())
        .get('/v1/locations')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Isolamento multi-tenant', () => {
    it('deve impedir STAFF de acessar location de outro tenant', async () => {
      // Staff do tenant A
      const staffARes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: `staff-a-${Date.now()}@example.com`,
          password: 'StrongPass123!',
          name: 'Staff A',
          role: 'STAFF',
          tenantSlug: 'petshop-central',
        });

      const staffAToken = staffARes.body.accessToken;

      // Criar location em tenant A
      const locRes = await request(app.getHttpServer())
        .post('/v1/locations')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({ name: 'Sala Protegida' })
        .expect(201);

      const locationId = locRes.body.id;

      // Staff do tenant B
      const staffBRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: `staff-b-${Date.now()}@example.com`,
          password: 'StrongPass123!',
          name: 'Staff B',
          role: 'STAFF',
          tenantSlug: 'efizion-bath-demo',
        });

      const staffBToken = staffBRes.body.accessToken;

      // Staff B não consegue acessar location de A
      await request(app.getHttpServer())
        .get(`/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${staffBToken}`)
        .expect(404);
    });
  });
});
