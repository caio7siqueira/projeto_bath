import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OmieQueueService } from './omie.queue';
import { fetchWithRetry } from '@/common/http-retry.util';

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

@Injectable()
export class OmieService {
  private readonly logger = new Logger(OmieService.name);
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly baseUrl = 'https://app.omie.com.br/api/v1';

  constructor(private prisma: PrismaService, private omieQueue: OmieQueueService) {
    this.appKey = process.env.OMIE_APP_KEY || '';
    this.appSecret = process.env.OMIE_APP_SECRET || '';

    if (!this.appKey || !this.appSecret) {
      this.logger.warn('Omie credentials not configured. Integration disabled.');
    }
  }

  async upsertCustomer(tenantId: string, customer: OmieCustomerDto): Promise<{ codigo_cliente_omie: number }> {
    if (!this.appKey || !this.appSecret) {
      throw new Error('Omie integration not configured');
    }

    const payload = {
      call: 'UpsertCliente',
      app_key: this.appKey,
      app_secret: this.appSecret,
      param: [customer],
    };

    const response = await fetchWithRetry(`${this.baseUrl}/geral/clientes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Omie upsert customer failed: ${error}`);
    }

    return response.json();
  }

  async createSalesOrder(tenantId: string, order: OmieSalesOrderDto): Promise<{ codigo_pedido: string }> {
    if (!this.appKey || !this.appSecret) {
      throw new Error('Omie integration not configured');
    }

    const payload = {
      call: 'IncluirPedido',
      app_key: this.appKey,
      app_secret: this.appSecret,
      param: [order],
    };

    const response = await fetchWithRetry(`${this.baseUrl}/produtos/pedido/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Omie create sales order failed: ${error}`);
    }

    return response.json();
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

    const event = await (this.prisma as any).omieSalesEvent.create({
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
    const event = (await (this.prisma as any).omieSalesEvent.findUnique({
      where: { id: eventId },
      include: { appointment: { include: { customer: true, service: true } } },
    })) as any;

    if (!event) {
      throw new Error(`OmieSalesEvent ${eventId} not found`);
    }

    if (event.status !== 'PENDING') {
      this.logger.warn(`Event ${eventId} already processed with status ${event.status}`);
      return;
    }

    try {
      const payload = event.payload as any;

      // 1. Upsert customer in Omie
      const omieCustomer: OmieCustomerDto = {
        nome_fantasia: payload.customerName,
        telefone1_numero: payload.customerPhone,
        email: payload.customerEmail,
        cnpj_cpf: event.appointment?.customer.cpf,
      };

      const customerResult = await this.upsertCustomer(event.tenantId, omieCustomer);

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

      const orderResult = await this.createSalesOrder(event.tenantId, omieOrder);

      await (this.prisma as any).omieSalesEvent.update({
        where: { id: eventId },
        data: {
          status: 'SUCCESS',
          omieOrderId: orderResult.codigo_pedido,
        },
      });

      this.logger.log(`Successfully processed OmieSalesEvent ${eventId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await (this.prisma as any).omieSalesEvent.update({
        where: { id: eventId },
        data: {
          status: 'ERROR',
          errorMessage,
        },
      });

      this.logger.error(`Failed to process OmieSalesEvent ${eventId}: ${errorMessage}`);
      throw error;
    }
  }

  async reprocessFailedEvent(eventId: string): Promise<void> {
    await (this.prisma as any).omieSalesEvent.update({
      where: { id: eventId },
      data: { status: 'PENDING' },
    });

    await this.processOmieSalesEvent(eventId);
  }
}
