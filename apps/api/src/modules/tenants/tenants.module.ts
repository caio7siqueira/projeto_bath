import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './tenants.repository';
import { TenantsController } from './tenants.controller';

@Module({
  providers: [TenantsService, TenantsRepository],
  controllers: [TenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}
