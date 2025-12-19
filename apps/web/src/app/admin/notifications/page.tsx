'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRole } from '@/lib/use-role';
import {
  listNotificationJobs,
  type NotificationJob,
  type NotificationJobsFilters,
  type NotificationStatus,
  type NotificationChannel,
} from '@/lib/api/notifications';
import NotificationSettings from './settings';

const statusOptions: NotificationStatus[] = ['SCHEDULED', 'SENT', 'ERROR', 'CANCELLED'];
const channelOptions: NotificationChannel[] = ['SMS', 'EMAIL', 'WHATSAPP'];

export default function NotificationsAdminPage() {
  const { isAdmin } = useRole();
  const [jobs, setJobs] = useState<NotificationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<NotificationJobsFilters>({ status: undefined, type: undefined });
  const [settings, setSettings] = useState(null);

  const load = async (opts: NotificationJobsFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await listNotificationJobs({ ...opts, page, pageSize });
      setJobs(resp.data || []);
      setTotal(resp.total || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar notificações';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
  }, [page, filters]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <Card>
          <p className="text-red-700">Apenas administradores podem acessar esta página.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
        <p className="text-gray-600">Histórico de NotificationJobs deste tenant.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Status</label>
              <select
                className="rounded-lg border border-gray-300 p-2 text-sm"
                value={filters.status || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, status: e.target.value as NotificationStatus || undefined }));
                }}
              >
                <option value="">Todos</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Canal</label>
              <select
                className="rounded-lg border border-gray-300 p-2 text-sm"
                value={filters.type || ''}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, type: e.target.value as NotificationChannel || undefined }));
                }}
              >
                <option value="">Todos</option>
                {channelOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setPage(1); load(filters); }} disabled={loading}>
              Recarregar
            </Button>
          </div>
        </div>
      </Card>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>}

      <Card>
        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-600">Nenhuma notificação encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Canal</Th>
                  <Th>Status</Th>
                  <Th>Appointment</Th>
                  <Th>Agendado</Th>
                  <Th>Enviado</Th>
                  <Th>Erro</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <Td>{job.type || '—'}</Td>
                    <Td>{job.status}</Td>
                    <Td className="font-mono text-xs">{job.appointmentId || '—'}</Td>
                    <Td>{formatScheduled(job)}</Td>
                    <Td>{job.sentAt ? formatDate(job.sentAt) : '—'}</Td>
                    <Td className="text-red-600 text-xs max-w-xs truncate" title={job.errorMessage || undefined}>
                      {job.errorMessage || '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>
              Página {page} de {totalPages} — {total} registros
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <NotificationSettings settings={settings} onUpdate={data => {/* PATCH para /v1/notification-settings */}} />
      </Card>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString();
}

function formatScheduled(job: NotificationJob) {
  // O backend não envia scheduledFor; usamos createdAt como aproximação
  // e exibimos "—" se não disponível.
  return job.createdAt ? formatDate(job.createdAt) : '—';
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
      {children}
    </th>
  );
}

function Td({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) {
  return <td className={`px-4 py-3 text-sm text-gray-900 ${className}`} title={title}>{children}</td>;
}
