import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsRepository } from './locations.repository';
import { LocationsController } from './locations.controller';

@Module({
  providers: [LocationsService, LocationsRepository],
  controllers: [LocationsController],
  exports: [LocationsService],
})
export class LocationsModule {}
