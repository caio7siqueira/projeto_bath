import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { RolesGuard } from 'apps/api/src/common/guards/roles.guard';

export const RequireRole = (...roles: string[]) =>
  applyDecorators(
    Roles(...roles),
    UseGuards(RolesGuard),
  );
