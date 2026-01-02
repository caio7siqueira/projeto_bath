

import { Injectable, Logger, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {

      private generateTokens(user: any) {
        const accessToken = this.jwtService.sign({
          sub: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        }, {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        });
        const refreshToken = this.jwtService.sign({
          sub: user.id,
          type: 'refresh',
        }, {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });
        return { accessToken, refreshToken };
      }
    private readonly logger = new Logger(AuthService.name);

    // ... outros métodos ...

    async logout(userId: string, refreshToken?: string): Promise<void> {
      // Se houver lógica para invalidar refresh tokens, implemente aqui.
      // Exemplo: adicionar o token a uma blacklist, remover de um banco, etc.
      this.logger.log(`User logged out: ${userId}`);
      // No mock, não faz nada.
    }

    constructor(
      private readonly prisma: PrismaService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}

    async register(dto: RegisterDto) {
      let tenantId: string | null = null;
      if (dto.role !== UserRole.SUPER_ADMIN) {
        if (!dto.tenantSlug) {
          throw new BadRequestException('tenantSlug é obrigatório para usuários não SUPER_ADMIN');
        }
        const tenant = await this.prisma.tenant.findUnique({
          where: { slug: dto.tenantSlug },
        });
        if (!tenant) {
          throw new UnauthorizedException('Invalid tenant');
        }
        tenantId = tenant.id;
      }
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
      const passwordHash = await bcrypt.hash(dto.password, 12);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name,
          role: dto.role,
          tenantId: tenantId ?? undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          createdAt: true,
        },
      });
      const tokens = await this.generateTokens(user);
      this.logger.log(`User registered: ${user.email} (${user.role})`);
      return {
        user,
        ...tokens,
      };
    }

    async login(dto: LoginDto) {
      if (process.env.NODE_ENV === 'development') {
        const user = {
          id: 'mock-user-id',
          email: dto.email,
          name: 'Usuário Dev',
          role: 'ADMIN',
          tenantId: 'mock-tenant-id',
        };
        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId });
        const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' });
        return { user, accessToken, refreshToken };
      }
      let tenantId: string | null = null;
      if (dto.tenantSlug) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { slug: dto.tenantSlug },
        });
        if (!tenant) {
          throw new UnauthorizedException('Invalid tenant');
        }
        tenantId = tenant.id;
      }
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const tokens = await this.generateTokens(user);
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
        ...tokens,
      };
    }

    async refresh(dto: RefreshDto) {
    if (process.env.NODE_ENV === 'development') {
      const user = {
        id: 'mock-user-id',
        email: 'dev@example.com',
        name: 'Usuário Dev',
        role: 'ADMIN',
        tenantId: 'mock-tenant-id',
      };
      const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId });
      const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' });
      return { user, accessToken, refreshToken };
    }
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      }) as { sub: string };
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }
      const tokens = await this.generateTokens(user);
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
        ...tokens,
      };
    } catch (e) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}
