import { Controller, Get, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'apps/api/src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'apps/api/src/common/guards/roles.guard';
import { Roles } from 'apps/api/src/common/decorators/roles.decorator';
import { CurrentUser } from 'apps/api/src/common/decorators/current-user.decorator';

@ApiTags('Protected')
@ApiBearerAuth()
@Controller('protected')
export class ProtectedController {
  @Get('ping')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ping with auth' })
  ping() {
    return { ok: true };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin-only endpoint' })
  adminOnly() {
    return { ok: true };
  }

  @Get('tenant/:tenantId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enforce same tenant access' })
  tenantCheck(@Param('tenantId') tenantId: string, @CurrentUser() user: any) {
    if (!user || user.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }
    return { ok: true };
  }
}
