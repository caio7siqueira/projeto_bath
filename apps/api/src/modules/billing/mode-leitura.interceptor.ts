import { CallHandler, ExecutionContext, Injectable, NestInterceptor, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModeLeituraInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.user?.tenantId;
    if (!tenantId) return next.handle();
    const subscription = await this.prisma.billingSubscription.findFirst({
      where: { tenantId },
    });
    if (subscription?.status === 'SUSPENDED' && req.method !== 'GET') {
      throw new ForbiddenException('Modo leitura: assinatura suspensa.');
    }
    return next.handle();
  }
}
