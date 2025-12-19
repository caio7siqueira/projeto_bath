import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantLimitsGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.user?.tenantId;
    if (!tenantId) return true;
    const subscription = await this.prisma.billingSubscription.findFirst({
      where: { tenant_id: tenantId },
      include: { plan: true },
    });
    if (subscription?.status === 'OVER_LIMIT') {
      // Não bloqueia, apenas exibe aviso
      req.overLimit = true;
    }
    return true;
  }
}
