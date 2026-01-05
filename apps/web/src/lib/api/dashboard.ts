import { DashboardService } from '@efizion/contracts';
import { safeSdkCall } from './errors';
import { unwrapData } from './sdk';

export interface DashboardStats {
  totalCustomers: number;
  totalPets: number;
  totalAppointments: number;
  totalLocations: number;
  _mock?: boolean;
}

export async function fetchDashboardReports(): Promise<DashboardStats> {
  const response = await safeSdkCall(
    DashboardService.dashboardControllerGetReports(),
    'Não conseguimos carregar os indicadores do dashboard.',
  );

  const rawStats = unwrapData<Partial<DashboardStats>>(response as any) ?? {};
  return {
    totalCustomers: rawStats.totalCustomers ?? 0,
    totalPets: rawStats.totalPets ?? 0,
    totalAppointments: rawStats.totalAppointments ?? 0,
    totalLocations: rawStats.totalLocations ?? 0,
    _mock: rawStats._mock,
  } satisfies DashboardStats;
}
