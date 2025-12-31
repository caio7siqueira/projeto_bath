import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
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
  }
}
