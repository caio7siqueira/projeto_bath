"use client";
import React, { useState } from 'react';
import useSWR from 'swr';
import { AppointmentsChart, RevenueChart, CreditsChart } from './charts';
import { ExportCSVButton } from './export-csv';
import TenantLimits from '../tenant/limits';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');

  const { data: appointments } = useSWR(() => from && to ? `/v1/reports/appointments/summary?from=${from}&to=${to}&groupBy=${groupBy}` : null, fetcher);
  const { data: revenue } = useSWR(() => from && to ? `/v1/reports/revenue/summary?from=${from}&to=${to}&groupBy=${groupBy}` : null, fetcher);
  const { data: credits } = useSWR(() => from && to ? `/v1/reports/credits/usage?from=${from}&to=${to}&groupBy=${groupBy}` : null, fetcher);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Relatórios Financeiros</h1>
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-white rounded shadow p-4">
        <label className="font-semibold">De:</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input input-bordered" />
        <label className="font-semibold">Até:</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input input-bordered" />
        <label className="font-semibold">Agrupar por:</label>
        <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="select select-bordered">
          <option value="day">Dia</option>
          <option value="month">Mês</option>
        </select>
      </div>
      <div className="mb-4 flex gap-2">
        <ExportCSVButton data={appointments || []} filename="agendamentos.csv" />
        <ExportCSVButton data={revenue || []} filename="receita.csv" />
        <ExportCSVButton data={credits || []} filename="creditos.csv" />
      </div>
      <div className="mb-10 bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-2 text-secondary">Agendamentos</h2>
        <AppointmentsChart data={appointments || []} />
        <div className="mt-2 text-sm text-gray-500">Total: {appointments?.reduce((acc, cur) => acc + (cur._count?.id || 0), 0) || 0}</div>
        {(!appointments || appointments.length === 0) && <div className="text-center text-gray-400 mt-4">Nenhum agendamento encontrado no período.</div>}
      </div>
      <div className="mb-10 bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-2 text-secondary">Receita Estimada</h2>
        <RevenueChart data={revenue || []} />
        <div className="mt-2 text-sm text-gray-500">Total: R$ {revenue?.reduce((acc, cur) => acc + (cur._sum?.price || 0), 0).toLocaleString('pt-br', { minimumFractionDigits: 2 }) || '0,00'}</div>
        {(!revenue || revenue.length === 0) && <div className="text-center text-gray-400 mt-4">Nenhuma receita encontrada no período.</div>}
      </div>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-2 text-secondary">Consumo de Créditos</h2>
        <CreditsChart data={credits || []} />
        <div className="mt-2 text-sm text-gray-500">Total SMS: {credits?.filter(c => c.channel === 'SMS').reduce((acc, cur) => acc + (cur._sum?.amount || 0), 0) || 0} | Total WhatsApp: {credits?.filter(c => c.channel === 'WHATSAPP').reduce((acc, cur) => acc + (cur._sum?.amount || 0), 0) || 0}</div>
        {(!credits || credits.length === 0) && <div className="text-center text-gray-400 mt-4">Nenhum consumo de créditos encontrado no período.</div>}
      </div>
      <TenantLimits />
    </div>
  );
}
