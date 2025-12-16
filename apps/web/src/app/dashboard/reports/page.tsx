'use client';

import { useMemo } from 'react';

const mockSummary = {
  total: 42,
  scheduled: 18,
  completed: 20,
  cancelled: 4,
};

const mockSeries = [
  { period: '2024-12-10', scheduled: 3, completed: 1, cancelled: 0 },
  { period: '2024-12-11', scheduled: 4, completed: 2, cancelled: 1 },
  { period: '2024-12-12', scheduled: 5, completed: 5, cancelled: 0 },
  { period: '2024-12-13', scheduled: 2, completed: 4, cancelled: 1 },
  { period: '2024-12-14', scheduled: 6, completed: 5, cancelled: 1 },
  { period: '2024-12-15', scheduled: 4, completed: 3, cancelled: 1 },
];

function formatPeriod(period: string) {
  return new Date(period).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function ReportsPage() {
  const totals = useMemo(() => mockSummary, []);
  const series = useMemo(() => mockSeries, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Relatórios</p>
        <h2 className="text-2xl font-semibold text-white">Visão de Agendamentos</h2>
        <p className="text-sm text-slate-400">Dados mockados. Conecte ao backend usando os endpoints /v1/reports/appointments/summary e /v1/reports/appointments/timeseries.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: totals.total },
          { label: 'Agendados', value: totals.scheduled },
          { label: 'Concluídos', value: totals.completed },
          { label: 'Cancelados', value: totals.cancelled },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-md shadow-black/30">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="text-3xl font-semibold text-white">{item.value}</p>
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
