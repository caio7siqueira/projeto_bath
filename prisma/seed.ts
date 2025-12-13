import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.create({ data: { name: 'Efizion Bath Demo' } });
  const location = await prisma.location.create({ data: { name: 'Main', tenantId: tenant.id } });
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', name: 'Admin', role: 'ADMIN', tenantId: tenant.id },
  });
  console.log('Seed complete');
  console.log({ tenant, location, admin });
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
