"use client";
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ChartSkeleton, EmptyState, ErrorBanner } from '@/components/feedback/VisualStates';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ExportCSVButton } from './export-csv';
import {
  fetchReportsTimeseries,
  fetchRevenueSummary,
  fetchCreditsUsage,
  type ReportsTimeseriesItem,
  type RevenueReportItem,
  type CreditsUsageItem,
} from '@/lib/api/reports';
import { normalizeApiError } from '@/lib/api/errors';

type ChartProps = { data: any[] };

const AppointmentsChart = dynamic<ChartProps>(
  () => import('./charts').then((mod) => mod.AppointmentsChart),
  { ssr: false, suspense: true },
);
const RevenueChart = dynamic<ChartProps>(
  () => import('./charts').then((mod) => mod.RevenueChart),
  { ssr: false, suspense: true },
);
const CreditsChart = dynamic<ChartProps>(
  () => import('./charts').then((mod) => mod.CreditsChart),
  { ssr: false, suspense: true },
);
const TenantLimitsSection = dynamic(
  () => import('../tenant/limits'),
  { ssr: false, suspense: true },
);

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');

  const shouldFetch = Boolean(from && to);
  const [appointmentsSeries, setAppointmentsSeries] = useState<ReportsTimeseriesItem[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<RevenueReportItem[]>([]);
  const [creditsSeries, setCreditsSeries] = useState<CreditsUsageItem[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{ title?: string; message: string; details?: string[] } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!shouldFetch) {
      setAppointmentsSeries([]);
      setRevenueSeries([]);
      setCreditsSeries([]);
      setErrorBanner(null);
      return;
    }
    let active = true;
    setChartsLoading(true);
    setErrorBanner(null);
    (async () => {
      try {
        const [appointmentsData, revenueData, creditsData] = await Promise.all([
          fetchReportsTimeseries(undefined, from, to, groupBy === 'month' ? 'month' : 'day'),
          fetchRevenueSummary({ from, to, groupBy }),
          fetchCreditsUsage({ from, to, groupBy }),
        ]);
        if (!active) return;
        setAppointmentsSeries(appointmentsData);
        setRevenueSeries(revenueData);
        setCreditsSeries(creditsData);
      } catch (err) {
        if (!active) return;
        const parsed = normalizeApiError(err, 'Não conseguimos carregar os relatórios.');
        const details = parsed.details.filter((detail) => !detail.field).map((detail) => detail.message);
        setErrorBanner({
          title: parsed.title,
          message: parsed.message,
          details: details.length ? details : undefined,
        });
      } finally {
        if (active) setChartsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [from, to, groupBy, shouldFetch, reloadToken]);

  const totalAppointments = useMemo(
    () => appointmentsSeries.reduce((acc, cur) => acc + (cur.scheduled ?? 0), 0),
    [appointmentsSeries],
  );
  const totalRevenue = useMemo(
    () => revenueSeries.reduce((acc, cur) => acc + (cur._sum?.price || 0), 0),
    [revenueSeries],
  );
  const smsUsage = useMemo(
    () => creditsSeries.filter((c) => c.channel === 'SMS').reduce((acc, cur) => acc + (cur._sum?.amount || 0), 0),
    [creditsSeries],
  );
  const whatsappUsage = useMemo(
    () => creditsSeries.filter((c) => c.channel === 'WHATSAPP').reduce((acc, cur) => acc + (cur._sum?.amount || 0), 0),
    [creditsSeries],
  );

  return (
    <div className="page-shell space-y-6">
      <header className="page-header">
        <div className="page-header__meta">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Insights</p>
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <p className="text-base text-slate-500">Selecione um período para analisar agenda, receita estimada e consumo de créditos.</p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => shouldFetch && setReloadToken((token) => token + 1)}>
            Recarregar dados
          </Button>
        </div>
      </header>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Relatórios', isCurrent: true },
        ]}
        note="Contexto registrado: você pode alternar entre dashboard e relatórios sem perder filtros, pois todo fluxo usa roteamento interno do Next."
      />
      <Card className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-semibold text-slate-600">De</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-surface-divider px-3 py-2 focus-visible:ring-brand-300" />
        <label className="text-sm font-semibold text-slate-600">Até</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-surface-divider px-3 py-2" />
        <label className="text-sm font-semibold text-slate-600">Agrupar por</label>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="rounded-lg border border-surface-divider px-3 py-2">
          <option value="day">Dia</option>
          <option value="month">Mês</option>
        </select>
        <div className="ml-auto flex flex-wrap gap-2">
          <ExportCSVButton data={appointmentsSeries} filename="agendamentos.csv" disabled={!appointmentsSeries.length} />
          <ExportCSVButton data={revenueSeries} filename="receita.csv" disabled={!revenueSeries.length} />
          <ExportCSVButton data={creditsSeries} filename="creditos.csv" disabled={!creditsSeries.length} />
        </div>
      </Card>

      {errorBanner && (
        <ErrorBanner
          scenario="reports-load"
          title={errorBanner.title}
          message={errorBanner.message}
          details={errorBanner.details}
          action={
            <button
              type="button"
              className="text-sm font-semibold text-blue-700"
              onClick={() => shouldFetch && setReloadToken((token) => token + 1)}
            >
              Tentar novamente
            </button>
          }
        />
      )}

      {!shouldFetch && (
        <EmptyState
          icon="📈"
          title="Selecione um intervalo de datas"
          description="Os gráficos são habilitados assim que você informar período inicial e final."
        />
      )}

      {shouldFetch && (
        <div className="space-y-6">
          <Card className="shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Agendamentos</h2>
                <p className="text-sm text-gray-500">Volume por status no período selecionado.</p>
              </div>
              <span className="text-sm font-semibold text-blue-600">Total: {totalAppointments}</span>
            </div>
            {chartsLoading ? (
              <ChartSkeleton />
            ) : appointmentsSeries.length > 0 ? (
              <Suspense fallback={<ChartSkeleton />}>
                <AppointmentsChart data={appointmentsSeries} />
              </Suspense>
            ) : (
              <EmptyState
                variant="inline"
                icon="🗓️"
                title="Nenhum agendamento no período"
                description="Tente expandir as datas ou revisar filtros."
              />
            )}
          </Card>

          <Card className="shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Receita estimada</h2>
                <p className="text-sm text-gray-500">Valores baseados nos serviços agendados.</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">
                Total: R$ {totalRevenue.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {chartsLoading ? (
              <ChartSkeleton />
            ) : revenueSeries.length > 0 ? (
              <Suspense fallback={<ChartSkeleton />}>
                <RevenueChart data={revenueSeries} />
              </Suspense>
            ) : (
              <EmptyState
                variant="inline"
                icon="💰"
                title="Nenhuma entrada encontrada"
                description="Cadastre valores nos serviços para visualizar projeções."
              />
            )}
          </Card>

          <Card className="shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Consumo de créditos</h2>
                <p className="text-sm text-gray-500">Comparativo entre canais de comunicação.</p>
              </div>
              <span className="text-sm font-semibold text-purple-600">
                SMS: {smsUsage} • WhatsApp: {whatsappUsage}
              </span>
            </div>
            {chartsLoading ? (
              <ChartSkeleton />
            ) : creditsSeries.length > 0 ? (
              <Suspense fallback={<ChartSkeleton />}>
                <CreditsChart data={creditsSeries} />
              </Suspense>
            ) : (
              <EmptyState
                variant="inline"
                icon="💬"
                title="Nenhum consumo registrado"
                description="Envie campanhas ou lembretes para acompanhar o uso aqui."
              />
            )}
          </Card>
        </div>
      )}

      <Suspense fallback={<Card className="text-gray-600">Carregando limites do plano...</Card>}>
        <TenantLimitsSection />
      </Suspense>
    </div>
  );
}
