const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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

  const url = `${API_BASE}/v1/reports/appointments/summary${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Fetch summary failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
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

  const url = `${API_BASE}/v1/reports/appointments/timeseries${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Fetch timeseries failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
