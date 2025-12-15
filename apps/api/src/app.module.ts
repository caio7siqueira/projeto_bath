import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerAuthModule } from './modules/customer-auth/customer-auth.module';
import { ProtectedModule } from './modules/protected/protected.module';

const envFilePath = Array.from(
  new Set([
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', '..', '.env'),
  ])
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath,
      validate: (config: Record<string, unknown>) => {
        const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
        const missing = required.filter((key) => !config[key]);
        if (missing.length) {
          throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        }
        return config;
      },
    }),
    AuthModule,
    CustomerAuthModule,
    ProtectedModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
