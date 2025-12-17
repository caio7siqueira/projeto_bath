import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { RegisterDto, LoginDto, RefreshDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // SUPER_ADMIN não precisa de tenant; demais perfis requerem tenantSlug válido
    let tenantId: string | null = null;
    if (dto.role !== $Enums.UserRole.SUPER_ADMIN) {
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
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Para usuários não SUPER_ADMIN: se tenantSlug for fornecido, deve corresponder;
    // se não for fornecido, permitimos login no próprio tenant do usuário.
    if (user.role !== $Enums.UserRole.SUPER_ADMIN) {
      if (dto.tenantSlug) {
        if (!user.tenant || user.tenant?.slug !== dto.tenantSlug) {
          throw new UnauthorizedException('Invalid tenant');
        }
      } else {
        if (!user.tenant) {
          throw new UnauthorizedException('Invalid tenant');
        }
      }
    } else if (dto.tenantSlug && user.tenant && user.tenant?.slug !== dto.tenantSlug) {
      // SUPER_ADMIN pode logar sem tenantSlug; se forneceu, deve corresponder
      throw new UnauthorizedException('Invalid tenant');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      await this.logLoginAttempt(user.id, false, 'Invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.logLoginAttempt(user.id, true);

    const tokens = await this.generateTokens(user);

    this.logger.log(`User logged in: ${user.email}`);

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
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      }) as { sub: string; jti: string };

      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          userId: payload.sub,
          jti: payload.jti,
          revokedAt: null,
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verifica expiração
      if (tokenRecord.expiresAt < new Date()) {
        await this.revokeRefreshToken(tokenRecord.id);
        throw new UnauthorizedException('Refresh token expired');
      }

      const matches = await bcrypt.compare(dto.refreshToken, tokenRecord.tokenHash);
      if (!matches) {
        await this.revokeRefreshToken(tokenRecord.id);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user, tokenRecord.id);
      return tokens;
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify(refreshToken, {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        }) as { jti: string };

        await this.prisma.refreshToken.updateMany({
          where: { userId, jti: payload.jti },
          data: { revokedAt: new Date() },
        });
      } catch (err) {
        // Token inválido -> revoga todos para o usuário
        await this.prisma.refreshToken.updateMany({
          where: { userId },
          data: { revokedAt: new Date() },
        });
      }
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  private async generateTokens(
    user: { id: string; email: string; role: string; tenantId: string | null },
    replacedTokenId?: string,
  ) {
    const accessPayload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const refreshJti = randomUUID();
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign({ sub: user.id, jti: refreshJti }, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    const refreshExpiresAt = new Date();
    const refreshDays = Number(this.configService.get('JWT_REFRESH_EXPIRES_DAYS') || 7);
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + refreshDays);

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const created = await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        jti: refreshJti,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    // Revoga token anterior, se informado, e vincula o novo
    if (replacedTokenId) {
      await this.prisma.refreshToken.updateMany({
        where: { id: replacedTokenId },
        data: { revokedAt: new Date(), replacedByTokenId: created.id },
      });
    }

    return { accessToken, refreshToken, refreshTokenId: created.id };
  }

  private async revokeRefreshToken(tokenId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  private async logLoginAttempt(
    userId: string,
    success: boolean,
    reason?: string,
  ) {
    await this.prisma.loginLog.create({
      data: {
        userId,
        success,
        reason,
        actorType: $Enums.ActorType.USER,
      },
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
}
