import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { paginatedResponse } from '../../common/dto/pagination.dto';
import { normalizePhone } from '../../common/phone.util';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new ConflictException('Telefone inválido');
    }
    try {
      return await this.prisma.customer.create({
        data: {
          tenantId,
          name: dto.name,
          phone,
          email: dto.email,
          cpf: dto.cpf,
          optInGlobal: dto.optInGlobal ?? true,
        },
      });
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

  async findAll(tenantId: string, query: QueryCustomersDto) {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      isActive: true,
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

    // Backward compatibility: if no page params, return simple array
    if (!query.page && !query.pageSize) {
      return this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Paginated response
    const { skip, take, orderBy } = query.toPrisma();
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginatedResponse(data, total, query.page!, query.pageSize!);
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        tenantId,
        isActive: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    // Check existence
    await this.findOne(tenantId, id);

    const phone = dto.phone ? normalizePhone(dto.phone) : undefined;
    if (dto.phone && !phone) {
      throw new ConflictException('Telefone inválido');
    }

    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {
          name: dto.name,
          phone,
          email: dto.email,
          cpf: dto.cpf,
          optInGlobal: dto.optInGlobal,
        },
      });
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

  async remove(tenantId: string, id: string) {
    // Check existence
    await this.findOne(tenantId, id);

    // Soft delete
    await this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Customer deleted successfully' };
  }

  // Contacts
  async listContacts(tenantId: string, customerId: string) {
    await this.findOne(tenantId, customerId);
    return this.prisma.customerContact.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createContact(tenantId: string, customerId: string, dto: CreateContactDto) {
    await this.findOne(tenantId, customerId);
    const phone = dto.phone ? normalizePhone(dto.phone) : null;
    if (dto.phone && !phone) {
      throw new ConflictException('Telefone inválido');
    }
    return this.prisma.customerContact.create({
      data: {
        tenantId,
        customerId,
        name: dto.name,
        email: dto.email,
        phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      },
    });
  }

  async updateContact(
    tenantId: string,
    customerId: string,
    contactId: string,
    dto: UpdateContactDto,
  ) {
    // Ensure contact belongs to tenant & customer
    const contact = await this.prisma.customerContact.findFirst({
      where: { id: contactId, tenantId, customerId },
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

  async deleteContact(tenantId: string, customerId: string, contactId: string) {
    const contact = await this.prisma.customerContact.findFirst({
      where: { id: contactId, tenantId, customerId },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.customerContact.delete({ where: { id: contactId } });
    return { message: 'Contact deleted successfully' };
  }
}
