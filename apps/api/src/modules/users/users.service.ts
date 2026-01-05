import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginatedResponse } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

interface RequestUser {
  id: string;
  role: UserRole;
  tenantId: string | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private readonly baseSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
    tenant: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async listUsers(requester: RequestUser, query: ListUsersDto) {
    const pagination = (query ?? new ListUsersDto()).toPrisma();
    const where: Prisma.UserWhereInput = {};

    const scopedTenant = this.resolveTenantScope(requester, query?.tenantId);
    if (scopedTenant !== undefined) {
      where.tenantId = scopedTenant;
    }

    if (query?.role) {
      where.role = query.role;
    }

    if (query?.onlyActive) {
      where.isActive = true;
    }

    if (query?.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const orderBy = pagination.orderBy ?? { createdAt: 'desc' };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
        select: this.baseSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, total, pagination.page, pagination.pageSize);
  }

  async createUser(requester: RequestUser, dto: CreateUserDto) {
    const tenantId = this.resolveTenantScopeForMutation(requester, dto.tenantId);

    if (dto.role === UserRole.SUPER_ADMIN && !this.isSuperAdmin(requester)) {
      throw new ForbiddenException('Apenas super administradores podem criar outro SUPER_ADMIN.');
    }

    if (!this.isSuperAdmin(requester) && dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Perfil inválido.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este email.');
    }

    const plainPassword = dto.password?.trim().length ? dto.password.trim() : this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        tenantId: tenantId ?? null,
        passwordHash,
        isActive: true,
      },
      select: this.baseSelect,
    });

    await this.recordAuditLog(tenantId ?? requester.tenantId, requester.id, 'USER_CREATE', {
      userId: user.id,
      role: user.role,
    });

    if (!dto.password) {
      this.logger.log(`Senha temporária gerada para ${dto.email}`);
    }

    return {
      user,
      temporaryPassword: dto.password ? undefined : plainPassword,
    };
  }

  async updateUser(requester: RequestUser, userId: string, dto: UpdateUserDto) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, role: true, email: true },
    });

    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    this.ensureCanManage(requester, target);

    if (target.id === requester.id && dto.role && dto.role !== requester.role) {
      throw new BadRequestException('Atualize outro administrador para alterar o próprio perfil.');
    }

    if (dto.role === UserRole.SUPER_ADMIN && !this.isSuperAdmin(requester)) {
      throw new ForbiddenException('Apenas super administradores podem atribuir este perfil.');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.name) {
      data.name = dto.name;
    }

    if (dto.role) {
      data.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      if (target.id === requester.id && dto.isActive === false) {
        throw new BadRequestException('Você não pode desativar a si mesmo.');
      }
      data.isActive = dto.isActive;
    }

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: this.baseSelect,
    });

    await this.recordAuditLog(target.tenantId ?? requester.tenantId, requester.id, 'USER_UPDATE', {
      userId: user.id,
      role: user.role,
      isActive: user.isActive,
    });

    return user;
  }

  async deactivateUser(requester: RequestUser, userId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, role: true, isActive: true },
    });

    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    this.ensureCanManage(requester, target);

    if (target.id === requester.id) {
      throw new BadRequestException('Você não pode desativar a si mesmo.');
    }

    if (!target.isActive) {
      return { message: 'Usuário já estava desativado.' };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await this.recordAuditLog(target.tenantId ?? requester.tenantId, requester.id, 'USER_DEACTIVATE', {
      userId: userId,
    });

    return { message: 'Usuário desativado com sucesso.' };
  }

  async resetPassword(requester: RequestUser, userId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, role: true },
    });

    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    this.ensureCanManage(requester, target);

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: this.baseSelect,
    });

    await this.recordAuditLog(target.tenantId ?? requester.tenantId, requester.id, 'USER_RESET_PASSWORD', {
      userId,
    });

    return { user, temporaryPassword };
  }

  private resolveTenantScope(requester: RequestUser, requestedTenantId?: string) {
    if (this.isSuperAdmin(requester)) {
      if (!requestedTenantId || requestedTenantId === 'all') {
        return undefined;
      }

      if (requestedTenantId === 'global') {
        return null;
      }

      return requestedTenantId;
    }

    if (!requester.tenantId) {
      throw new BadRequestException('Usuário sem tenant configurado.');
    }

    return requester.tenantId;
  }

  private resolveTenantScopeForMutation(requester: RequestUser, requestedTenantId?: string) {
    if (this.isSuperAdmin(requester)) {
      if (!requestedTenantId || requestedTenantId === 'global') {
        return requestedTenantId === 'global' ? null : undefined;
      }
      return requestedTenantId;
    }

    if (!requester.tenantId) {
      throw new BadRequestException('Configure um tenant antes de criar usuários.');
    }

    if (requestedTenantId && requestedTenantId !== requester.tenantId) {
      throw new ForbiddenException('Você só pode criar usuários do seu tenant.');
    }

    return requester.tenantId;
  }

  private ensureCanManage(requester: RequestUser, target: { tenantId: string | null; role: UserRole }) {
    if (target.role === UserRole.SUPER_ADMIN && !this.isSuperAdmin(requester)) {
      throw new ForbiddenException('Não é possível alterar um SUPER_ADMIN.');
    }

    if (this.isSuperAdmin(requester)) {
      return;
    }

    if (!requester.tenantId || requester.tenantId !== target.tenantId) {
      throw new ForbiddenException('Operação não permitida neste tenant.');
    }
  }

  private isSuperAdmin(user: RequestUser) {
    return user.role === UserRole.SUPER_ADMIN;
  }

  private generateTemporaryPassword() {
    return randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  }

  private async recordAuditLog(tenantId: string | null | undefined, actorId: string, action: string, payload?: Record<string, unknown>) {
    if (!tenantId) {
      return;
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          actorId,
          action,
          payload: payload ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Falha ao registrar audit log ${action}: ${error instanceof Error ? error.message : error}`);
    }
  }
}
