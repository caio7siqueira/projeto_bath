import request from 'supertest';
import { bootstrapApp } from './support/bootstrap-app';
import { startEnv } from './support/test-env';
import { expectData, expectList } from './support/http-assertions';

describe('Customer Contacts (E2E)', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let adminToken: string;
  let customerId: string;

  beforeAll(async () => {
    const env = await startEnv();
    stopEnv = env.stop;
    const boot = await bootstrapApp({ databaseUrl: env.databaseUrl, redisUrl: env.redisUrl });
    app = boot.app;

    const adminEmail = `admin_contacts_${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'StrongPass123!',
        name: 'Admin Contacts',
        role: 'ADMIN',
        tenantSlug: 'efizion-bath-demo',
      })
      .expect(201);
    adminToken = expectData(registerRes).accessToken;

    // Cria customer
    const custRes = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Contact', phone: `+55119${Date.now().toString().slice(-8)}` })
      .expect(201);
    customerId = expectData(custRes).id;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (stopEnv) await stopEnv();
  });

  it('deve criar, listar, atualizar e remover contato', async () => {
    // Create
    const createRes = await request(app.getHttpServer())
      .post(`/v1/customers/${customerId}/contacts`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Maria', phone: '+5511999999999' })
      .expect(201);
    const contactId = expectData(createRes).id;

    // List
    const listRes = await request(app.getHttpServer())
      .get(`/v1/customers/${customerId}/contacts`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const contacts = expectList(listRes);
    expect(Array.isArray(contacts)).toBe(true);
    expect(contacts.find(c => c.id === contactId)).toBeTruthy();

    // Update
    const updateRes = await request(app.getHttpServer())
      .patch(`/v1/customers/${customerId}/contacts/${contactId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Maria Souza' })
      .expect(200);
    expect(expectData(updateRes).name).toBe('Maria Souza');

    // Delete
    await request(app.getHttpServer())
      .delete(`/v1/customers/${customerId}/contacts/${contactId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
