import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BillingSuspendedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.user?.tenantId;
    if (!tenantId) return true;
    const subscription = await this.prisma.billingSubscription.findFirst({
      where: { tenant_id: tenantId },
    });
    if (subscription?.status === 'SUSPENDED') {
      throw new ForbiddenException('Tenant em modo leitura devido à suspensão de assinatura.');
    }
    return true;
  }
}
