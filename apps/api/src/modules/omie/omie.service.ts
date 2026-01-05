import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OmieQueueService } from './omie.queue';
import { fetchWithRetry } from '../../common/http-retry.util';
import { ListOmieEventsQueryDto, TestOmieConnectionDto, UpsertOmieConnectionDto } from './dto/omie-connection.dto';
import { OmieEventStatus } from './omie.constants';

export interface OmieCustomerDto {
  nome_fantasia: string;
  telefone1_ddd?: string;
  telefone1_numero?: string;
  email?: string;
  cnpj_cpf?: string;
}

export interface OmieSalesOrderDto {
  codigo_cliente_integracao: string;
  codigo_pedido_integracao: string;
  data_previsao: string;
  etapa: string;
  observacoes?: string;
  det: Array<{
    ide: { codigo_item_integracao: string };
    produto: { descricao: string; quantidade: number; valor_unitario: number };
  }>;
}

type OmieCredentialSource = 'TENANT' | 'ENV' | 'PROVIDED';

interface OmieResolvedCredentials {
  appKey: string;
  appSecret: string;
  source: OmieCredentialSource;
}

@Injectable()
export class OmieService {
  private readonly logger = new Logger(OmieService.name);
  private readonly baseUrl = 'https://app.omie.com.br/api/v1';
  private readonly envCredentials?: { appKey: string; appSecret: string };

  constructor(private prisma: PrismaService, private omieQueue: OmieQueueService) {
    const envKey = process.env.OMIE_APP_KEY;
    const envSecret = process.env.OMIE_APP_SECRET;

    if (envKey && envSecret) {
      this.envCredentials = { appKey: envKey, appSecret: envSecret };
    } else {
      this.logger.warn('Omie credentials not configured. Tenants must provide appKey/appSecret.');
    }
  }

  async getConnectionStatus(tenantId: string) {
    const connection = await this.prisma.omieConnection.findUnique({ where: { tenantId } });

    if (connection) {
      return {
        configured: true,
        source: 'TENANT' as OmieCredentialSource,
        updatedAt: connection.updatedAt,
        createdAt: connection.createdAt,
      };
    }

    if (this.envCredentials) {
      return { configured: true, source: 'ENV' as OmieCredentialSource, updatedAt: null, createdAt: null };
    }

    return { configured: false, source: null, updatedAt: null, createdAt: null };
  }

  async upsertConnection(tenantId: string, body: UpsertOmieConnectionDto) {
    const connection = await this.prisma.omieConnection.upsert({
      where: { tenantId },
      update: { appKey: body.appKey, appSecret: body.appSecret },
      create: { tenantId, appKey: body.appKey, appSecret: body.appSecret },
    });

    return {
      message: 'Omie credentials saved',
      updatedAt: connection.updatedAt,
      source: 'TENANT' as OmieCredentialSource,
    };
  }

  async testConnection(tenantId: string, body: TestOmieConnectionDto) {
    const credentials = await this.resolveCredentials(tenantId, body);
    await this.performHealthCheck(tenantId, credentials);
    return { ok: true, source: credentials.source };
  }

  async listEvents(tenantId: string, query: ListOmieEventsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.OmieSalesEventWhereInput = { tenantId };
    if (query.status) {
      where.status = query.status;
    }

    const [events, total] = await this.prisma.$transaction([
      this.prisma.omieSalesEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.omieSalesEvent.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        page,
        pageSize,
        total,
        totalPages: total ? Math.ceil(total / pageSize) : 0,
        status: query.status ?? null,
      },
    };
  }

  async upsertCustomer(
    tenantId: string,
    customer: OmieCustomerDto,
    credentials?: OmieResolvedCredentials,
  ): Promise<{ codigo_cliente_omie: number }> {
    return this.executeOmieCall(
      tenantId,
      '/geral/clientes/',
      {
        call: 'UpsertCliente',
        param: [customer],
      },
      credentials,
    );
  }

  async createSalesOrder(
    tenantId: string,
    order: OmieSalesOrderDto,
    credentials?: OmieResolvedCredentials,
  ): Promise<{ codigo_pedido: string }> {
    return this.executeOmieCall(
      tenantId,
      '/produtos/pedido/',
      {
        call: 'IncluirPedido',
        param: [order],
      },
      credentials,
    );
  }

  async createSalesEventForAppointment(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
        pet: true,
      },
    });

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const payload = {
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      customerName: appointment.customer.name,
      customerPhone: appointment.customer.phone,
      customerEmail: appointment.customer.email,
      serviceId: appointment.serviceId,
      petName: appointment.pet?.name,
      startsAt: appointment.startsAt.toISOString(),
      notes: appointment.notes,
    };

    const event = await this.prisma.omieSalesEvent.create({
      data: {
        tenantId: appointment.tenantId,
        appointmentId: appointment.id,
        status: 'PENDING',
        payload,
      },
    });

    this.logger.log(`Created OmieSalesEvent for appointment ${appointmentId}`);

    // Enfileira processamento pelo worker
    try {
      await this.omieQueue.enqueueProcessEvent(event.id);
    } catch (e) {
      this.logger.error('Failed to enqueue Omie event for processing', e as any);
    }
  }

  async processOmieSalesEvent(eventId: string): Promise<void> {
    const event = await this.prisma.omieSalesEvent.findUnique({
      where: { id: eventId },
      include: { appointment: { include: { customer: true, service: true } } },
    });

    if (!event) {
      throw new Error(`OmieSalesEvent ${eventId} not found`);
    }

    if (event.status === 'SUCCESS') {
      this.logger.warn(`Event ${eventId} already processed successfully.`);
      return;
    }

    try {
      const payload = event.payload as any;
      const credentials = await this.resolveCredentials(event.tenantId);

      await this.prisma.omieSalesEvent.update({
        where: { id: eventId },
        data: {
          status: 'PROCESSING',
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
          errorMessage: null,
          lastErrorCode: null,
        },
      });

      // 1. Upsert customer in Omie
      const omieCustomer: OmieCustomerDto = {
        nome_fantasia: payload.customerName,
        telefone1_numero: payload.customerPhone,
        email: payload.customerEmail,
        cnpj_cpf: event.appointment?.customer.cpf ?? undefined,
      };

      const customerResult = await this.upsertCustomer(event.tenantId, omieCustomer, credentials);

      // 2. Create sales order
      const omieOrder: OmieSalesOrderDto = {
        codigo_cliente_integracao: event.appointment!.customerId,
        codigo_pedido_integracao: event.appointmentId!,
        data_previsao: payload.startsAt,
        etapa: '50', // Status do pedido (customizar conforme necessário)
        observacoes: payload.notes || `Atendimento para ${payload.petName}`,
        det: [
          {
            ide: { codigo_item_integracao: payload.serviceId || 'default-service' },
            produto: {
              descricao: 'Serviço de Banho e Tosa',
              quantidade: 1,
              valor_unitario: 0, // Preço será buscado ou configurado
            },
          },
        ],
      };

      const orderResult = await this.createSalesOrder(event.tenantId, omieOrder, credentials);

      await this.prisma.omieSalesEvent.update({
        where: { id: eventId },
        data: {
          status: 'SUCCESS',
          omieOrderId: orderResult.codigo_pedido,
          lastErrorCode: null,
        },
      });

      this.logger.log(`Successfully processed OmieSalesEvent ${eventId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.omieSalesEvent.update({
        where: { id: eventId },
        data: {
          status: 'ERROR',
          errorMessage,
          lastErrorCode: this.extractErrorCode(error),
        },
      });

      this.logger.error(`Failed to process OmieSalesEvent ${eventId}: ${errorMessage}`);
      throw error;
    }
  }

  async reprocessFailedEvent(eventId: string): Promise<void> {
    const event = await this.prisma.omieSalesEvent.update({
      where: { id: eventId },
      data: { status: 'PENDING', errorMessage: null, lastErrorCode: null },
    });

    await this.omieQueue.enqueueProcessEvent(event.id);
  }

  private async performHealthCheck(tenantId: string, credentials: OmieResolvedCredentials) {
    await this.executeOmieCall(
      tenantId,
      '/geral/clientes/',
      {
        call: 'ListarClientesResumido',
        param: [
          {
            pagina: 1,
            registros_por_pagina: 1,
            apenas_importado_api: 'N',
          },
        ],
      },
      credentials,
    );
  }

  private async resolveCredentials(
    tenantId: string,
    override?: TestOmieConnectionDto,
  ): Promise<OmieResolvedCredentials> {
    if (override && (override.appKey || override.appSecret)) {
      if (!override.appKey || !override.appSecret) {
        throw new BadRequestException('Both appKey and appSecret are required for override testing.');
      }
      return { appKey: override.appKey, appSecret: override.appSecret, source: 'PROVIDED' };
    }

    const tenantConnection = await this.prisma.omieConnection.findUnique({ where: { tenantId } });
    if (tenantConnection) {
      return {
        appKey: tenantConnection.appKey,
        appSecret: tenantConnection.appSecret,
        source: 'TENANT',
      };
    }

    if (this.envCredentials) {
      return { ...this.envCredentials, source: 'ENV' };
    }

    throw new BadRequestException('Omie integration not configured for this tenant.');
  }

  private async executeOmieCall<T>(
    tenantId: string,
    endpoint: string,
    payload: Record<string, unknown>,
    credentials?: OmieResolvedCredentials,
  ): Promise<T> {
    const resolved = credentials ?? (await this.resolveCredentials(tenantId));

    const response = await fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        app_key: resolved.appKey,
        app_secret: resolved.appSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Omie request to ${endpoint} failed: ${errorText}`);
      Object.assign(error, { status: response.status });
      throw error;
    }

    return response.json();
  }

  private extractErrorCode(error: unknown): string | null {
    if (typeof error === 'object' && error && 'status' in error) {
      return String((error as Record<string, unknown>).status);
    }

    if (error instanceof Error && 'code' in error && (error as Record<string, unknown>).code) {
      return String((error as Record<string, unknown>).code);
    }

    return null;
  }
}
