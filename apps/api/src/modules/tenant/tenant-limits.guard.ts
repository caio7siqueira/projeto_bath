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
      where: { tenantId },
      include: { plan: true },
    });
    // 'OVER_LIMIT' não existe em SubscriptionStatus do Prisma Client
    // if (subscription?.status === 'OVER_LIMIT') {
    //   // Não bloqueia, apenas exibe aviso
    //   req.overLimit = true;
    // }
    return true;
  }
}
