import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function processNotificationJob(jobId: string) {
  const job = await prisma.notificationJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  // 1. Verificar opt-in (exemplo: via config do tenant)
  const config = await prisma.tenantConfig.findUnique({ where: { tenantId: job.tenantId } });
  // Se for tipo REMINDER e opt-in desativado
  const payload = typeof job.payload === 'object' && job.payload !== null ? job.payload as { type?: string } : {};
  if (config && payload.type === 'REMINDER' && !config.reminderEnabled) {
    await prisma.notificationJob.update({
      where: { id: jobId },
      data: { status: 'ERROR', errorMessage: 'Opt-in desativado' },
    });
    return;
  }

  // 2. Verificar saldo do canal
  const wallet = await prisma.messageCreditsWallet.findFirst({
    where: { tenantId: job.tenantId },
  });
  if (!wallet || wallet.balance <= 0) {
    await prisma.notificationJob.update({
      where: { id: jobId },
      data: { status: 'ERROR', errorMessage: 'Saldo insuficiente' },
    });
    // Registra tentativa
    if (wallet) {
      await prisma.messageCreditTransaction.create({
        data: {
          tenantId: job.tenantId,
          channel: job.channel,
          walletId: wallet.id,
          type: 'CONSUME',
          amount: 0,
          reason: 'Tentativa sem saldo',
        },
      });
    }
    return;
  }

  // 3. Enviar mensagem (mock)
  let sent = false;
  let providerId = null;
  try {
    // Aqui integraria com provider real
    sent = true;
    providerId = 'mock-provider-id';
  } catch (e) {
    sent = false;
  }

  // 4. Registrar status e debitar crédito SOMENTE se enviado
  if (sent) {
    await prisma.notificationJob.update({
      where: { id: jobId },
      data: { status: 'SENT', providerMessageId: providerId },
    });
    await prisma.messageCreditsWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: 1 } },
    });
    if (wallet) {
      await prisma.messageCreditTransaction.create({
        data: {
          tenantId: job.tenantId,
          channel: job.channel,
          walletId: wallet.id,
          type: 'CONSUME',
          amount: 1,
          reason: 'Envio de mensagem',
        },
      });
    }
  } else {
    await prisma.notificationJob.update({
      where: { id: jobId },
      data: { status: 'ERROR', errorMessage: 'Falha no envio' },
    });
  }
}
