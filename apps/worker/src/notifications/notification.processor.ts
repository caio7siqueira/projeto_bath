import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function processNotificationJob(jobId: string) {
  const job = await prisma.notificationJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  // 1. Verificar opt-in (exemplo: via config do tenant)
  const config = await prisma.tenantConfig.findUnique({ where: { tenantId: job.tenant_id } });
  if (config && job.type === 'REMINDER' && !config.reminderEnabled) {
    await prisma.notificationJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: 'Opt-in desativado' },
    });
    return;
  }

  // 2. Verificar saldo do canal
  const wallet = await prisma.messageCreditsWallet.findUnique({
    where: { tenant_id_channel: { tenant_id: job.tenant_id, channel: job.channel } },
  });
  if (!wallet || wallet.balance <= 0) {
    await prisma.notificationJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: 'Saldo insuficiente' },
    });
    // Registra tentativa
    await prisma.messageCreditTransaction.create({
      data: {
        tenant_id: job.tenant_id,
        channel: job.channel,
        type: 'CONSUME',
        amount: 0,
        reason: 'Tentativa sem saldo',
        walletId: wallet?.id,
      },
    });
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
      data: { status: 'SENT', provider_message_id: providerId },
    });
    await prisma.messageCreditsWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: 1 } },
    });
    await prisma.messageCreditTransaction.create({
      data: {
        tenant_id: job.tenant_id,
        channel: job.channel,
        type: 'CONSUME',
        amount: 1,
        reason: 'Envio de mensagem',
        walletId: wallet.id,
      },
    });
  } else {
    await prisma.notificationJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: 'Falha no envio' },
    });
  }
}
