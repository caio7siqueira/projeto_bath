import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    TenantsModule,
    LocationsModule,
    CustomersModule,
    AppointmentsModule,
    ReportsModule,
    PetsModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
