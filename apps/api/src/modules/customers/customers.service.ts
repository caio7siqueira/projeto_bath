import { ForbiddenException } from '@nestjs/common';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { paginatedResponse } from '../../common/dto/pagination.dto';
import { normalizePhone } from '../../common/phone.util';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    // Logging para debug
    console.log('[CustomersService.create] tenantId:', tenantId);
    console.log('[CustomersService.create] dto:', JSON.stringify(dto));
    const phone = normalizePhone(dto.phone);
    if (!tenantId || typeof tenantId !== 'string') {
      throw new ConflictException('tenantId obrigatório e deve ser string');
    }
    if (!dto.name || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new ConflictException('Nome obrigatório e deve ser string não vazia');
    }
    if (!dto.phone || typeof dto.phone !== 'string' || dto.phone.trim().length === 0) {
      throw new ConflictException('Telefone obrigatório e deve ser string não vazia');
    }
    if (!phone) {
      throw new ConflictException('Telefone inválido');
    }
    try {
      // Remover status e qualquer campo não presente no banco
      return await this.prisma.customer.create({
        data: {
          tenantId,
          name: dto.name,
          phone,
          email: dto.email ?? undefined,
          cpf: dto.cpf ?? undefined,
          optInGlobal: typeof dto.optInGlobal === 'boolean' ? dto.optInGlobal : true,
          // NÃO incluir status, isActive, deleted_at, lastLoginAt, createdAt, updatedAt
        },
      });
    } catch (error) {
      console.error('[CustomersService.create] Prisma error:', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Customer with this phone already exists');
      }
      throw error;
    }
  }

  async findAll(tenantId: string, query: QueryCustomersDto) {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      isActive: true,
      // status removido do filtro, pois pode não existir no banco
    };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q } },
      ];
    }

    if (query.email) {
      where.email = query.email;
    }

    if (query.phone) {
      where.phone = normalizePhone(query.phone) || query.phone;
    }

    const { skip, take, orderBy, page, pageSize } = query.toPrisma();
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginatedResponse(data, total, page, pageSize);
  }

  async findOne(id: string, user: any) {
    const where = user.role === 'SUPER_ADMIN'
      ? { id, deletedAt: null }
      : { id, tenantId: user.tenantId, deletedAt: null };
    const customer = await this.prisma.customer.findFirst({ where });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, user: any) {
    const where = user.role === 'SUPER_ADMIN'
      ? { id, deletedAt: null }
      : { id, tenantId: user.tenantId, deletedAt: null };
    const customer = await this.prisma.customer.findFirst({ where });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    const phone = dto.phone ? normalizePhone(dto.phone) ?? undefined : undefined;
    if (dto.phone && !phone) {
      throw new ConflictException('Telefone inválido');
    }
    try {
      const updated = await this.prisma.customer.update({
        where: { id },
        data: {
          name: dto.name,
          phone,
          email: dto.email,
          cpf: dto.cpf,
          optInGlobal: dto.optInGlobal,
        },
      });
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Customer with this phone already exists');
      }
      throw error;
    }
  }

  async softDelete(id: string, user: any) {
    // Contrato: SUPER_ADMIN pode deletar qualquer, outros só do próprio tenant
    const customer = await this.findOne(id, user);
    if (user.role !== 'SUPER_ADMIN' && customer.tenantId !== user.tenantId) {
      throw new NotFoundException('Customer not found');
    }
    await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
    await this.prisma.appointment.updateMany({
      where: {
        customerId: id,
        status: 'SCHEDULED',
        startsAt: { gt: new Date() },
      },
      data: {
        status: 'CANCELLED',
        notes: 'Cancelado por remoção do cliente',
        cancelledAt: new Date(),
      },
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId: customer.tenantId,
        actorId: user.id,
        action: 'CUSTOMER_SOFT_DELETE',
        payload: { customerId: id },
      },
    });
    return { message: 'Customer deleted (soft)' };
  }

  // Contacts
  async listContacts(customer: any) {
    // O controller já garante isolamento e existência do customer
    return this.prisma.customerContact.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createContact(customer: any, dto: CreateContactDto) {
    // O controller já garante que o customer existe e o tenantId está correto
    const phone = dto.phone ? normalizePhone(dto.phone) : null;
    if (dto.phone && !phone) {
      throw new ConflictException('Telefone inválido');
    }
    return this.prisma.customerContact.create({
      data: {
        tenantId: customer.tenantId,
        customerId: customer.id,
        name: dto.name,
        email: dto.email,
        phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      },
    });
  }

  async updateContact(
    customer: any,
    contactId: string,
    dto: UpdateContactDto,
  ) {
    // O controller já garante que o customer existe e o ID é confiável
    const contact = await this.prisma.customerContact.findFirst({
      where: { id: contactId, customerId: customer.id },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    const phone = dto.phone ? normalizePhone(dto.phone) : undefined;
    if (dto.phone && !phone) {
      throw new ConflictException('Telefone inválido');
    }
    return this.prisma.customerContact.update({
      where: { id: contactId },
      data: {
        name: dto.name,
        email: dto.email,
        phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async deleteContact(customer: any, contactId: string) {
    // O controller já garante que o customer existe e o ID é confiável
    const contact = await this.prisma.customerContact.findFirst({
      where: { id: contactId, customerId: customer.id },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    await this.prisma.customerContact.delete({ where: { id: contactId } });
    return { message: 'Contact deleted successfully' };
  }
}
