import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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
