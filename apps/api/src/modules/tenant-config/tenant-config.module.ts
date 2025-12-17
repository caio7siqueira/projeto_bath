import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenantConfigService } from './tenant-config.service';
import { TenantConfigController } from './tenant-config.controller';

@Module({
  imports: [PrismaModule],
  providers: [TenantConfigService],
  controllers: [TenantConfigController],
  exports: [TenantConfigService],
})
export class TenantConfigModule {}
