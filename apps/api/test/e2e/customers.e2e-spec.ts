import request from 'supertest';
import { startEnv } from './support/test-env';
import { bootstrapApp } from './support/bootstrap-app';

describe('Customers CRUD E2E', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let adminToken: string;
  let superAdminToken: string;
  let secondTenantToken: string;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp({ 
      databaseUrl: env.databaseUrl, 
      redisUrl: env.redisUrl 
    });
    app = boot.app;


    // Create admin user for testing
    const adminEmail = `admin_${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'StrongPass123!',
        name: 'Admin User',
        role: 'ADMIN',
        tenantSlug: 'efizion-bath-demo',
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ 
        email: adminEmail, 
        password: 'StrongPass123!',
        tenantSlug: 'efizion-bath-demo'
      })
      .expect(200);

    adminToken = loginRes.body.accessToken;

    // Create SUPER_ADMIN user for testing delete
    const superAdminEmail = `superadmin_${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: superAdminEmail,
        password: 'StrongPass123!',
        name: 'Super Admin User',
        role: 'SUPER_ADMIN',
        tenantSlug: 'efizion-bath-demo',
      })
      .expect(201);

    const superAdminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: superAdminEmail,
        password: 'StrongPass123!',
        tenantSlug: 'efizion-bath-demo',
      })
      .expect(200);

    superAdminToken = superAdminLoginRes.body.accessToken;

    // Create second tenant and user for isolation testing
    const secondTenantRes = await request(app.getHttpServer())
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Second Tenant',
        slug: `tenant-${Date.now()}`,
        planType: 'FREE',
      })
      .expect(201);

    const secondTenantSlug = secondTenantRes.body.slug;

    const secondAdminEmail = `admin2_${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: secondAdminEmail,
        password: 'StrongPass123!',
        name: 'Second Admin',
        role: 'ADMIN',
        tenantSlug: secondTenantSlug,
      })
      .expect(201);

    const secondLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ 
        email: secondAdminEmail, 
        password: 'StrongPass123!',
        tenantSlug: secondTenantSlug
      })
      .expect(200);

    secondTenantToken = secondLoginRes.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (stopEnv) await stopEnv().catch(() => undefined);
  });

  describe('CRUD Happy Path', () => {
    let customerId: string;

    it('POST /v1/customers - create customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'John Doe',
          phone: '+5511999999999',
          email: 'john@example.com',
          cpf: '12345678900',
          optInGlobal: true,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'John Doe',
        phone: '+5511999999999',
        email: 'john@example.com',
        cpf: '12345678900',
        optInGlobal: true,
        isActive: true,
      });
      expect(res.body.id).toBeDefined();
      customerId = res.body.id;
    });

    it('POST /v1/customers - reject duplicate phone', async () => {
      await request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Jane Doe',
          phone: '+5511999999999', // same as above
          email: 'jane@example.com',
        })
        .expect(409);
    });

    it('GET /v1/customers - list all customers', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((c: any) => c.id === customerId)).toBe(true);
    });

    it('GET /v1/customers?page=1&pageSize=10 - paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/customers?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toMatchObject({
        page: 1,
        pageSize: 10,
      });
    });

    it('GET /v1/customers?q=john - search by query', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/customers?q=john')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.name.toLowerCase().includes('john'))).toBe(true);
    });

    it('GET /v1/customers/:id - get single customer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: customerId,
        name: 'John Doe',
        phone: '+5511999999999',
      });
    });

    it('PATCH /v1/customers/:id - update customer', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'John Updated',
          email: 'john.updated@example.com',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        id: customerId,
        name: 'John Updated',
        email: 'john.updated@example.com',
        phone: '+5511999999999', // unchanged
      });
    });

    it('DELETE /v1/customers/:id - soft delete customer (SUPER_ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.message).toBeDefined();

      // Verify it's gone from listing
      const listRes = await request(app.getHttpServer())
        .get('/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listRes.body.some((c: any) => c.id === customerId)).toBe(false);
    });

    it('GET /v1/customers/:id - 404 on deleted customer', async () => {
      await request(app.getHttpServer())
        .get(`/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1CustomerId: string;

    it('Create customer in tenant 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tenant 1 Customer',
          phone: '+5511888888888',
          email: 'tenant1@example.com',
        })
        .expect(201);

      tenant1CustomerId = res.body.id;
    });

    it('Tenant 2 cannot access tenant 1 customer', async () => {
      await request(app.getHttpServer())
        .get(`/v1/customers/${tenant1CustomerId}`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .expect(404);
    });

    it('Tenant 2 cannot update tenant 1 customer', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/customers/${tenant1CustomerId}`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .send({ name: 'Hacked' })
        .expect(404);
    });

    it('Tenant 2 cannot delete tenant 1 customer', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/customers/${tenant1CustomerId}`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .expect(404);
    });

    it('Tenant 2 does not see tenant 1 customers in list', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/customers')
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((c: any) => c.id !== tenant1CustomerId)).toBe(true);
    });
  });
});
