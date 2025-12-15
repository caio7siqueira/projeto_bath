import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto';
import { paginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  private readonly prisma = new PrismaClient();

  constructor() {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({
        data: {
          tenantId,
          name: dto.name,
          phone: dto.phone,
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
      where.phone = query.phone;
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

    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {
          name: dto.name,
          phone: dto.phone,
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
}
