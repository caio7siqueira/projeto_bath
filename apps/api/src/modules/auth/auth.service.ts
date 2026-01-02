import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RefreshToken, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
      if (!tenant) {
        throw new UnauthorizedException('Tenant inválido');
      }
      tenantId = tenant.id;
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.prisma.user.create({
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
      },
    });

    const tokens = await this.issueTokens(created);
    this.logger.log(`Usuário registrado: ${created.email} (${created.role})`);
    return {
      user: created,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    let tenantId: string | null = null;
    if (dto.tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
      if (!tenant) {
        throw new UnauthorizedException('Tenant inválido');
      }
      tenantId = tenant.id;
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (tenantId) {
      const belongsToTenant = user.tenantId && user.tenantId === tenantId;
      const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
      if (!belongsToTenant && !isSuperAdmin) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const safeUser = this.sanitizeUser(user);
    const tokens = await this.issueTokens(safeUser);
    return {
      user: safeUser,
      ...tokens,
    };
  }

  async refresh(dto: RefreshDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as { sub: string; jti?: string; type?: string };

      if (!payload.jti || payload.type !== 'refresh') {
        throw new UnauthorizedException('Refresh token inválido');
      }

      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: { jti: payload.jti, userId: payload.sub },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      await this.ensureRefreshTokenIsActive(tokenRecord, dto.refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
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
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const safeUser = this.sanitizeUser(user);
      const tokens = await this.issueTokens(safeUser, tokenRecord.id);
      return {
        user: safeUser,
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`Erro ao renovar token: ${error instanceof Error ? error.message : error}`);
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.log(`Usuário ${userId} realizou logout (todas as sessões revogadas)`);
      return;
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as { sub: string; jti?: string };

      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: { jti: payload.jti, userId },
      });

      if (tokenRecord) {
        const matches = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
        if (matches) {
          await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() },
          });
          this.logger.log(`Refresh token revogado para user ${userId}`);
          return;
        }
      }
    } catch (error) {
      this.logger.warn(`Falha ao validar refreshToken no logout: ${error instanceof Error ? error.message : error}`);
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
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

  private sanitizeUser(user: { id: string; email: string; name: string; role: UserRole; tenantId: string | null }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  private async issueTokens(user: AuthUser, previousTokenId?: string) {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
      },
    );

    const jti = randomBytes(16).toString('hex');
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
        jti,
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );

    const expiresAt = this.extractExpirationFromToken(refreshToken);
    const tokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          tokenHash,
          jti,
          userId: user.id,
          expiresAt,
        },
      });

      if (previousTokenId) {
        await tx.refreshToken.updateMany({
          where: { id: previousTokenId },
          data: {
            revokedAt: new Date(),
            replacedByTokenId: created.id,
          },
        });
      }
    });

    return { accessToken, refreshToken };
  }

  private extractExpirationFromToken(token: string) {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    // Fallback de 7 dias
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  private async ensureRefreshTokenIsActive(record: RefreshToken, token: string) {
    if (record.revokedAt) {
      throw new UnauthorizedException('Refresh token revogado');
    }

    if (record.expiresAt <= new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token expirado');
    }

    const matches = await bcrypt.compare(token, record.tokenHash);
    if (!matches) {
      await this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token inválido');
    }
  }
}
