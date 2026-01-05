import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerAuthModule } from './modules/customer-auth/customer-auth.module';
import { ProtectedModule } from './modules/protected/protected.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { LocationsModule } from './modules/locations/locations.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PetsModule } from './modules/pets/pets.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OmieModule } from './modules/omie/omie.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TenantConfigModule } from './modules/tenant-config/tenant-config.module';
import { BillingModule } from './modules/billing/billing.module';
import { ServicesModule } from './modules/services/services.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecurrenceSeriesModule } from './modules/recurrence-series/recurrence-series.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';

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
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuthModule,
    CustomerAuthModule,
    ProtectedModule,
    TenantsModule,
    LocationsModule,
    CustomersModule,
    AppointmentsModule,
    ReportsModule,
    PetsModule,
    DashboardModule,
    OmieModule,
    NotificationsModule,
    TenantConfigModule,
    BillingModule,
    ServicesModule,
    RecurrenceSeriesModule,
    SuperadminModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
