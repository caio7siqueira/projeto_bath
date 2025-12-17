import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './tenants.repository';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [PrismaModule],
  providers: [TenantsService, TenantsRepository],
  controllers: [TenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}
