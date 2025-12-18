
import { apiFetch } from '../api';

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
  token: string,
  from?: string,
  to?: string
): Promise<ReportsSummary> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiFetch(`/reports/appointments/summary${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchReportsTimeseries(
  token: string,
  from?: string,
  to?: string,
  granularity?: 'day' | 'month'
): Promise<ReportsTimeseriesItem[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (granularity) params.set('granularity', granularity);
  const qs = params.toString();
  return apiFetch(`/reports/appointments/timeseries${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
