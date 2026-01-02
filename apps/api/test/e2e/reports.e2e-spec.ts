import request from 'supertest';
import { bootstrapApp } from './support/bootstrap-app';
import { startEnv } from './support/test-env';
import { expectData, expectList } from './support/http-assertions';

/**
 * Reports E2E
 * - Usa Testcontainers (startEnv) + bootstrapApp
 * - Prefixo /v1
 */

describe('Reports (E2E)', () => {
  let stopEnv: () => Promise<void>;
  let app: any;
  let adminToken: string;
  let tenantId: string;
  let locationId: string;
  let customerId: string;
  let todayKey: string;
  let tomorrowKey: string;
  let base: number;
  let todayStart: Date;
  let todayEnd: Date;
  let tomorrowStart: Date;
  let tomorrowEnd: Date;

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
      .send({ name: 'Sala Reports' })
      .expect(201);
    locationId = expectData(locRes).id;

    // Cria customer
    const custRes = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Reports', phone: `+55119${Date.now().toString().slice(-8)}` })
      .expect(201);
    customerId = expectData(custRes).id;

    base = Date.now() + 60 * 60 * 1000; // +1h
    todayStart = new Date(base);
    todayEnd = new Date(base + 60 * 60 * 1000);
    tomorrowStart = new Date(base + 24 * 60 * 60 * 1000);
    tomorrowEnd = new Date(base + 25 * 60 * 60 * 1000);

    todayKey = todayStart.toISOString().slice(0, 10);
    tomorrowKey = tomorrowStart.toISOString().slice(0, 10);

    // A1: SCHEDULED (mantém status padrão)
    await request(app.getHttpServer())
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId, locationId, startsAt: todayStart.toISOString(), endsAt: todayEnd.toISOString() })
      .expect(201);

    // A2: COMPLETED
    const a2 = await request(app.getHttpServer())
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId, locationId, startsAt: tomorrowStart.toISOString(), endsAt: tomorrowEnd.toISOString() })
      .expect(201);
    const a2Data = expectData(a2);
    await request(app.getHttpServer())
      .patch(`/v1/appointments/${a2Data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DONE' })
      .expect(200);

    // A3: CANCELLED
    const a3 = await request(app.getHttpServer())
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId, locationId, startsAt: new Date(base + 2 * 24 * 60 * 60 * 1000).toISOString(), endsAt: new Date(base + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() })
      .expect(201);
    const a3Data = expectData(a3);
    await request(app.getHttpServer())
      .post(`/v1/appointments/${a3Data.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (stopEnv) await stopEnv();
  });

  it('GET /v1/reports/appointments/summary deve retornar contagens por status', async () => {

    // Use datas base para garantir que o filtro cobre todos os agendamentos criados

    const from = todayStart.toISOString();
    const to = new Date(base + 3 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .get(`/v1/reports/appointments/summary?from=${from}&to=${to}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const summary = expectData(res);
    expect(summary).toMatchObject({
      total: 3,
      scheduled: 1,
      completed: 1,
      cancelled: 1,
    });
  });

  it('GET /v1/reports/appointments/timeseries deve agrupar por dia', async () => {


    const from = todayStart.toISOString();
    const to = new Date(base + 3 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .get(`/v1/reports/appointments/timeseries?from=${from}&to=${to}&granularity=day`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const series = expectList(res);
    const byPeriod = Object.fromEntries(series.map(item => [item.period, item]));

    expect(byPeriod[todayKey]).toMatchObject({ period: todayKey, scheduled: 1 });
    expect(byPeriod[tomorrowKey]).toMatchObject({ period: tomorrowKey, completed: 1 });
  });
});
