import { DashboardService } from '@efizion/contracts';
import { safeSdkCall } from './errors';

export interface DashboardStats {
  totalCustomers: number;
  totalPets: number;
  totalAppointments: number;
  totalLocations: number;
  _mock?: boolean;
}

export async function fetchDashboardReports(): Promise<DashboardStats> {
  return safeSdkCall(
    DashboardService.dashboardControllerGetReports(),
    'Não conseguimos carregar os indicadores do dashboard.',
  );
}
