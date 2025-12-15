import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TwilioProvider } from '../../integrations/twilio.provider';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomerAuthService {
  private readonly prisma = new PrismaClient();
  private readonly logger = new Logger(CustomerAuthService.name);

  private OTP_LENGTH = 6;
  private OTP_TTL_MIN = 5; // 5 minutes
  private OTP_MAX_ATTEMPTS = 5;
  private OTP_REQUEST_THROTTLE_SEC = 60; // 60 seconds
  private LOCKOUT_MIN = 5; // locked for 5 minutes after attempts exceeded

  constructor(
    private readonly sms: TwilioProvider,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    let customer = await this.prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: dto.phone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { tenantId: tenant.id, name: dto.phone, phone: dto.phone, optInGlobal: true },
      });
    }

    const now = new Date();

    const lastCode = await this.prisma.oTpCode.findFirst({
      where: { phone: dto.phone },
      orderBy: { createdAt: 'desc' },
    });

    if (lastCode) {
      if (lastCode.lockedUntil && lastCode.lockedUntil > now) {
        throw new BadRequestException('Too many attempts. Try again later.');
      }
      const secondsSinceLast = (now.getTime() - lastCode.createdAt.getTime()) / 1000;
      if (secondsSinceLast < this.OTP_REQUEST_THROTTLE_SEC) {
        throw new BadRequestException('Please wait before requesting another code.');
      }
    }

    const code = this.generateCode(this.OTP_LENGTH);
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(now.getTime() + this.OTP_TTL_MIN * 60 * 1000);

    await this.prisma.oTpCode.create({
      data: {
        customerId: customer.id,
        phone: dto.phone,
        codeHash,
        expiresAt,
      },
    });

    await this.sms.sendSms(dto.phone, `Seu código de acesso: ${code}`);

    return { ok: true, expiresAt };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: dto.phone },
    });
    if (!customer) throw new BadRequestException('Invalid phone');

    const now = new Date();

    const otp = await this.prisma.oTpCode.findFirst({
      where: { phone: dto.phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('No code found');
    if (otp.consumedAt) throw new BadRequestException('Code already used');
    if (otp.expiresAt <= now) throw new BadRequestException('Code expired');
    if (otp.lockedUntil && otp.lockedUntil > now)
      throw new BadRequestException('Too many attempts. Try later.');

    const matches = await bcrypt.compare(dto.code, otp.codeHash);

    if (!matches) {
      const attempts = otp.attemptCount + 1;
      const data: any = { attemptCount: attempts };
      if (attempts >= this.OTP_MAX_ATTEMPTS) {
        data.lockedUntil = new Date(now.getTime() + this.LOCKOUT_MIN * 60 * 1000);
      }
      await this.prisma.oTpCode.update({ where: { id: otp.id }, data });
      await this.prisma.loginLog.create({
        data: {
          actorType: 'CUSTOMER',
          customerId: customer.id,
          phone: dto.phone,
          success: false,
          reason: 'Invalid code',
        },
      });
      throw new BadRequestException('Invalid code');
    }

    await this.prisma.oTpCode.update({
      where: { id: otp.id },
      data: { consumedAt: now },
    });

    await this.prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: now } });

    await this.prisma.loginLog.create({
      data: {
        actorType: 'CUSTOMER',
        customerId: customer.id,
        phone: dto.phone,
        success: true,
      },
    });

    const accessToken = this.jwt.sign(
      { tenantId: tenant.id, customerId: customer.id, actorType: 'customer' },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
      },
    );

    const refreshToken = this.jwt.sign(
      { sub: customer.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );

    const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        customerId: customer.id,
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private generateCode(length: number) {
    const digits = '0123456789';
    let out = '';
    for (let i = 0; i < length; i++) {
      out += digits[Math.floor(Math.random() * digits.length)];
    }
    return out;
  }
}
