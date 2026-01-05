import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReports(tenantId: string) {
    // Para DEV, retorna mock rápido para destravar dashboard
    if (process.env.NODE_ENV === 'development') {
      return {
        totalCustomers: 1,
        totalPets: 1,
        totalAppointments: 1,
        totalLocations: 1,
        _mock: true,
      };
    }
    try {
      // Produção: lógica real
      const [totalCustomers, totalPets, totalAppointments, totalLocations] =
        await Promise.all([
          this.prisma.customer.count({
            where: { tenantId },
          }),
          this.prisma.pet.count({
            where: { tenantId },
          }),
          this.prisma.appointment.count({
            where: { tenantId },
          }),
          this.prisma.location.count({
            where: { tenantId },
          }),
        ]);

      return {
        totalCustomers,
        totalPets,
        totalAppointments,
        totalLocations,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Falha ao carregar relatórios do dashboard para tenant ${tenantId}: ${errorMessage}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Não foi possível carregar os indicadores do dashboard.');
    }
  }
}
