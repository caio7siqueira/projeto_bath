import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { TwilioProvider } from '../../integrations/twilio.provider';

@Module({
  imports: [ConfigModule, JwtModule.register({}), PrismaModule],
  providers: [CustomerAuthService, TwilioProvider],
  controllers: [CustomerAuthController],
})
export class CustomerAuthModule {}
