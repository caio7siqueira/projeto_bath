import { PrismaClient } from '@prisma/client';
import { processNotificationJob } from './notification.processor';
const prisma = new PrismaClient();

export async function consumePendingJobs() {
  const jobs = await prisma.notificationJob.findMany({
    where: { status: 'PENDING' },
    orderBy: { created_at: 'asc' },
    take: 10,
  });
  for (const job of jobs) {
    await processNotificationJob(job.id);
  }
}

// Exemplo de execução periódica
setInterval(() => {
  consumePendingJobs();
}, 5000);
