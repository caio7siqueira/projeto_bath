'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchReportsSummary, fetchReportsTimeseries, ReportsSummary, ReportsTimeseriesItem } from '@/lib/api/reports';
import { getAuthToken } from '@/lib/api/client';

function formatPeriod(period: string) {
  return new Date(period).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<ReportsSummary>({ total: 0, scheduled: 0, completed: 0, cancelled: 0 });
  const [series, setSeries] = useState<ReportsTimeseriesItem[]>([]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Você precisa estar autenticado para acessar os relatórios.');
      setLoading(false);
      return;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = sevenDaysAgo.toISOString();
    const to = now.toISOString();

    Promise.all([
      fetchReportsSummary(token, from, to),
      fetchReportsTimeseries(token, from, to, 'day'),
    ])
      .then(([summaryData, timeseriesData]) => {
        setTotals(summaryData);
        setSeries(timeseriesData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar relatórios:', err);
        setError(err.message || 'Falha ao buscar dados');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Relatórios</p>
        <p className="text-slate-300">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Relatórios</p>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
          <p className="font-semibold">Erro ao carregar relatórios</p>
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Relatórios</p>
        <h2 className="text-2xl font-semibold text-white">Visão de Agendamentos</h2>
        <p className="text-sm text-slate-400">Relatórios reais dos agendamentos do seu petshop.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: totals.total, color: 'text-slate-50' },
          { label: 'Agendados', value: totals.scheduled, color: 'text-sky-300' },
          { label: 'Concluídos', value: totals.completed, color: 'text-emerald-300' },
          { label: 'Cancelados', value: totals.cancelled, color: 'text-rose-300' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-md shadow-black/30">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className={`text-3xl font-semibold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-md shadow-black/30">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Série temporal (dia)</p>
            <h3 className="text-lg font-semibold text-white">Agendamentos</h3>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((item) => (
            <div key={item.period} className="rounded-lg bg-slate-900/60 p-3 border border-white/5">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{formatPeriod(item.period)}</p>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-200">
                <span>Agendados</span>
                <span className="font-semibold text-sky-300">{item.scheduled}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>Concluídos</span>
                <span className="font-semibold text-emerald-300">{item.completed}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>Cancelados</span>
                <span className="font-semibold text-rose-300">{item.cancelled}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
