import { Module } from '@nestjs/common';
import { TenantLimitsController } from './tenant-limits.controller';
import { TenantLimitsService } from './tenant-limits.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantLimitsController],
  providers: [TenantLimitsService],
})
export class TenantLimitsModule {}
