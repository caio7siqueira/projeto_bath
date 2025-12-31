import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TENANT_SLUG = process.env.SEED_TENANT_SLUG || 'efizion-bath-demo';
const TENANT_NAME = process.env.SEED_TENANT_NAME || 'Efizion Bath Demo';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@demo.com';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin Demo';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

async function seedBillingPlans() {
  await prisma.billingPlan.createMany({
    data: [
      {
        code: 'STARTER',
        name: 'Starter',
        limits: { filiais: 1, usuarios: 3 },
        priceCents: 9900,
        active: true,
      },
      {
        code: 'PRO',
        name: 'Pro',
        limits: { filiais: 3, usuarios: 10 },
        priceCents: 19900,
        active: true,
      },
      {
        code: 'FRANCHISE',
        name: 'Franchise',
        limits: { filiais: 10, usuarios: 50 },
        priceCents: 49900,
        active: true,
      },
    ],
    skipDuplicates: true,
  });
}

async function run() {
  // 1) Tenant (idempotente)
  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: { name: TENANT_NAME },
    create: { name: TENANT_NAME, slug: TENANT_SLUG },
  });

  // 2) Location (idempotente por (tenantId,name) se houver unique; se não houver, usa findFirst + create)
  const existingLocation = await prisma.location.findFirst({
    where: { tenantId: tenant.id, name: 'Main' },
  });

  const location =
    existingLocation ??
    (await prisma.location.create({
      data: { name: 'Main', tenantId: tenant.id },
    }));

  // 3) Admin (idempotente por email)
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: ADMIN_NAME,
      role: 'ADMIN',
      tenantId: tenant.id,
      // se já existir e você quiser manter a senha antiga, remova esta linha
      passwordHash,
    },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'ADMIN',
      tenantId: tenant.id,
      passwordHash,
    },
  });

  await seedBillingPlans();

  // 4) Assinatura de teste para o tenant
  const existingSub = await prisma.billingSubscription.findFirst({
    where: { tenantId: tenant.id },
  });
  if (!existingSub) {
    await prisma.billingSubscription.create({
      data: {
        tenantId: tenant.id,
        planCode: 'STARTER',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
      },
    });
    console.log('Assinatura de teste criada para tenant:', tenant.id);
  }

  console.log('Seed complete');
  console.log({
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    location: { id: location.id, name: location.name, tenantId: location.tenantId },
    admin: { id: admin.id, email: admin.email, role: admin.role, tenantId: admin.tenantId },
  });
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });