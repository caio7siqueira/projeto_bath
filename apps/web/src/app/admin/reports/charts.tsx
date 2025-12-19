import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export function AppointmentsChart({ data }: { data: any[] }) {
  const labels = data?.map(d => d.day || d.month) || [];
  const done = data?.filter(d => d.status === 'DONE').map(d => d._count?.id || 0) || [];
  const canceled = data?.filter(d => d.status === 'CANCELED').map(d => d._count?.id || 0) || [];
  const noShow = data?.filter(d => d.status === 'NO_SHOW').map(d => d._count?.id || 0) || [];
  return <Bar data={{
    labels,
    datasets: [
      { label: 'Realizados', data: done, backgroundColor: '#22c55e' },
      { label: 'Cancelados', data: canceled, backgroundColor: '#f87171' },
      { label: 'No-show', data: noShow, backgroundColor: '#fbbf24' },
    ],
  }} />;
}

export function RevenueChart({ data }: { data: any[] }) {
  const labels = data?.map(d => d.day || d.month) || [];
  const revenue = data?.map(d => d._sum?.price || 0) || [];
  return <Line data={{
    labels,
    datasets: [
      { label: 'Receita Estimada', data: revenue, borderColor: '#2563eb', backgroundColor: '#93c5fd' },
    ],
  }} />;
}

export function CreditsChart({ data }: { data: any[] }) {
  const labels = data?.map(d => d.day || d.month) || [];
  const sms = data?.filter(d => d.channel === 'SMS').map(d => d._sum?.amount || 0) || [];
  const whatsapp = data?.filter(d => d.channel === 'WHATSAPP').map(d => d._sum?.amount || 0) || [];
  return <Bar data={{
    labels,
    datasets: [
      { label: 'SMS', data: sms, backgroundColor: '#0ea5e9' },
      { label: 'WhatsApp', data: whatsapp, backgroundColor: '#22d3ee' },
    ],
  }} />;
}
