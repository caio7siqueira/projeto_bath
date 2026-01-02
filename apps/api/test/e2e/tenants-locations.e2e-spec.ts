import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';
import { PrismaClient } from '@prisma/client';
import { expectData, expectList, expectError } from './support/http-assertions';

describe('Tenants & Locations E2E', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let prisma: PrismaClient;
  let adminToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    
    const boot = await bootstrapApp({
      databaseUrl: env.databaseUrl,
      redisUrl: env.redisUrl,
    });
    app = boot.app;
    prisma = new PrismaClient({ datasources: { db: { url: env.databaseUrl } } });

    // Create admin user
    const adminEmail = 'admin@example.com';
    const adminPassword = 'StrongPass123!';
    const registerRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: adminEmail,
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        tenantSlug: 'efizion-bath-demo',
      });

    if (registerRes.status !== 201) {
      // If already exists, perform login to obtain token
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: adminEmail, password: adminPassword, tenantSlug: 'efizion-bath-demo' })
        .expect(200);
      adminToken = expectData(loginRes).accessToken;
    } else {
      adminToken = expectData(registerRes).accessToken;
    }
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

      const tenant = expectData(res);
      expect(tenant).toHaveProperty('id');
      expect(tenant.name).toBe('Petshop Central');
      expect(tenant.slug).toBe('petshop-central');
      tenantId = tenant.id;
    });

    it('deve rejeitar slug duplicado', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Petshop Duplicate',
          slug: 'petshop-central',
        })
        .expect(409);

      const error = expectError(res, 'ERR_DUPLICATE_VALUE');
      expect(error.message).toContain('registro');
    });
  });

  describe('GET /v1/tenants', () => {
    it('deve listar tenants (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const tenants = expectList(res);
      expect(tenants.length).toBeGreaterThan(0);
    });
  });

  describe('GET /v1/tenants/:id', () => {
    it('deve obter tenant por ID (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const tenant = expectData(res);
      expect(tenant.id).toBe(tenantId);
      expect(tenant.slug).toBe('petshop-central');
    });

    it('deve retornar 404 para ID inválido', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/tenants/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
      expectError(res, 'ERR_NOT_FOUND');
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

      expect(expectData(res).name).toBe('Petshop Central Updated');
    });

    it('deve desativar tenant', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      expect(expectData(res).isActive).toBe(false);
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
        })
        .expect(201);

      const staffToken = expectData(staffRes).accessToken;

      const res = await request(app.getHttpServer())
        .post('/v1/locations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Sala de Banho A',
        })
        .expect(201);
      const location = expectData(res);
      expect(location).toHaveProperty('id');
      expect(location.name).toBe('Sala de Banho A');
      expect(location.tenantId).toBeDefined();
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
        })
        .expect(201);

      const staffToken = expectData(staffRes).accessToken;

      const res = await request(app.getHttpServer())
        .get('/v1/locations')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);
      const locations = expectList(res);
      expect(Array.isArray(locations)).toBe(true);
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
        })
        .expect(201);

      const staffAToken = expectData(staffARes).accessToken;

      // Criar location em tenant A
      const locRes = await request(app.getHttpServer())
        .post('/v1/locations')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({ name: 'Sala Protegida' })
        .expect(201);

      const locationId = expectData(locRes).id;

      // Staff do tenant B
      const staffBRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: `staff-b-${Date.now()}@example.com`,
          password: 'StrongPass123!',
          name: 'Staff B',
          role: 'STAFF',
          tenantSlug: 'efizion-bath-demo',
        })
        .expect(201);

      const staffBToken = expectData(staffBRes).accessToken;

      // Staff B não consegue acessar location de A
      const res = await request(app.getHttpServer())
        .get(`/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${staffBToken}`)
        .expect(404);
      expectError(res, 'ERR_NOT_FOUND');
    });
  });
});
