import { Module } from '@nestjs/common';
import { OmieService } from './omie.service';
import { OmieController } from './omie.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OmieController],
  providers: [OmieService],
  exports: [OmieService],
})
export class OmieModule {}
