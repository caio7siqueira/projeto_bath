import { ReportsService } from '@efizion/contracts';
import { apiFetch } from '../api';
import { safeSdkCall } from './errors';
import { unwrapCollection, unwrapData } from './sdk';

export interface ReportsSummary {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

export interface ReportsTimeseriesItem {
  period: string;
  scheduled: number;
  completed: number;
  cancelled: number;
}

export async function fetchReportsSummary(
  _token?: string,
  from?: string,
  to?: string
): Promise<ReportsSummary> {
  const response = await safeSdkCall(
    ReportsService.reportsControllerGetAppointmentsSummary({ from, to }),
    'Não foi possível carregar o resumo do período.',
  );
  return unwrapData<ReportsSummary>(response as any);
}

export async function fetchReportsTimeseries(
  _token?: string,
  from?: string,
  to?: string,
  granularity?: 'day' | 'month'
): Promise<ReportsTimeseriesItem[]> {
  const response = await safeSdkCall(
    ReportsService.reportsControllerGetAppointmentsTimeseries({
      from,
      to,
      granularity,
    }),
    'Não foi possível carregar a série histórica.',
  );
  const { data } = unwrapCollection<ReportsTimeseriesItem>(response as any);
  return data;
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export type RevenueReportItem = Record<string, unknown> & {
  period?: string;
  _sum?: { price?: number };
};

interface ReportFilters {
  from?: string;
  to?: string;
  groupBy?: string;
}

export async function fetchRevenueSummary(filters: ReportFilters = {}): Promise<RevenueReportItem[]> {
  const query = buildQuery({ from: filters.from, to: filters.to, groupBy: filters.groupBy });
  return safeSdkCall(
    apiFetch(`/reports/revenue/summary${query}`),
    'Não foi possível carregar a receita estimada.',
  );
}

export type CreditsUsageItem = Record<string, unknown> & {
  channel?: string;
  _sum?: { amount?: number };
};

export async function fetchCreditsUsage(filters: ReportFilters = {}): Promise<CreditsUsageItem[]> {
  const query = buildQuery({ from: filters.from, to: filters.to, groupBy: filters.groupBy });
  return safeSdkCall(
    apiFetch(`/reports/credits/usage${query}`),
    'Não foi possível carregar o consumo de créditos.',
  );
}
