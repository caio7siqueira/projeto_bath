import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly prisma = new PrismaClient();

  async getReports(tenantId: string) {
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
