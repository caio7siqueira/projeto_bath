'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRole } from '@/lib/use-role';
import {
  fetchOmieConnectionStatus,
  listOmieEvents,
  reprocessOmieEvent,
  saveOmieConnection,
  testOmieConnection,
  type OmieConnectionStatusResponse,
  type OmieEvent,
  type OmieEventStatus,
  type OmieEventsMeta,
} from '@/lib/api/omie';
import { SettingsNav } from '../_components/SettingsNav';

const STATUS_LABELS: Record<OmieEventStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pendente', classes: 'bg-amber-100 text-amber-800 border border-amber-200' },
  PROCESSING: { label: 'Processando', classes: 'bg-sky-100 text-sky-800 border border-sky-200' },
  SUCCESS: { label: 'Sucesso', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  ERROR: { label: 'Erro', classes: 'bg-rose-100 text-rose-800 border border-rose-200' },
};

type EventFilter = 'ALL' | OmieEventStatus;
const EVENT_FILTERS: { label: string; value: EventFilter }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Processando', value: 'PROCESSING' },
  { label: 'Sucesso', value: 'SUCCESS' },
  { label: 'Erro', value: 'ERROR' },
];

const PAGE_SIZE = 10;

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function EventStatusBadge({ status }: { status: OmieEventStatus }) {
  const props = STATUS_LABELS[status];
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${props.classes}`}>{props.label}</span>;
}

function ConnectionChip({ connection }: { connection: OmieConnectionStatusResponse | null }) {
  if (!connection) return null;
  return (
    <div className="flex flex-wrap gap-3">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          connection.configured ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
        }`}
      >
        {connection.configured ? 'Configurado' : 'Não Configurado'}
      </span>
      {connection.source && (
        <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
          Fonte: {connection.source === 'ENV' ? 'Variáveis de ambiente' : 'Painel'}
        </span>
      )}
    </div>
  );
}

export default function OmieIntegrationPage() {
  const { isAdmin } = useRole();
  const [connection, setConnection] = useState<OmieConnectionStatusResponse | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [form, setForm] = useState({ appKey: '', appSecret: '' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [eventFilter, setEventFilter] = useState<EventFilter>('ALL');
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<OmieEvent[]>([]);
  const [eventsMeta, setEventsMeta] = useState<OmieEventsMeta | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const canTestWithOverride = form.appKey.trim().length > 0 && form.appSecret.trim().length > 0;

  const loadConnection = useCallback(async () => {
    setConnectionLoading(true);
    setConnectionError(null);
    try {
      const data = await fetchOmieConnectionStatus();
      setConnection(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar a conexão.';
      setConnectionError(message);
    } finally {
      setConnectionLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const response = await listOmieEvents({
        status: eventFilter === 'ALL' ? undefined : eventFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      setEvents(response.data);
      setEventsMeta(response.meta);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar os eventos Omie.';
      setEventsError(message);
    } finally {
      setEventsLoading(false);
    }
  }, [eventFilter, page]);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSave = async () => {
    if (!form.appKey.trim() || !form.appSecret.trim()) {
      setConnectionError('Informe appKey e appSecret.');
      return;
    }
    setSaving(true);
    setConnectionError(null);
    setSaveMessage(null);
    try {
      await saveOmieConnection({ appKey: form.appKey.trim(), appSecret: form.appSecret.trim() });
      setForm({ appKey: '', appSecret: '' });
      setSaveMessage('Credenciais atualizadas com sucesso.');
      await loadConnection();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar credenciais.';
      setConnectionError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!connection?.configured && !canTestWithOverride) {
      setTestMessage({ type: 'error', text: 'Configure credenciais ou informe appKey/appSecret para testar.' });
      return;
    }
    setTesting(true);
    setTestMessage(null);
    try {
      const payload = canTestWithOverride ? { appKey: form.appKey.trim(), appSecret: form.appSecret.trim() } : undefined;
      const result = await testOmieConnection(payload);
      setTestMessage({
        type: 'success',
        text: payload ? 'Teste concluído usando credenciais informadas.' : `Teste concluído usando fonte ${result.source === 'ENV' ? 'ENV' : 'Painel'}.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao testar a integração.';
      setTestMessage({ type: 'error', text: message });
    } finally {
      setTesting(false);
    }
  };

  const handleReprocess = async (eventId: string) => {
    setReprocessingId(eventId);
    try {
      await reprocessOmieEvent(eventId);
      await loadEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao reenfileirar evento.';
      setEventsError(message);
    } finally {
      setReprocessingId(null);
    }
  };

  const activeFilterLabel = useMemo(() => EVENT_FILTERS.find((f) => f.value === eventFilter)?.label ?? 'Eventos', [eventFilter]);
  const totalPages = eventsMeta?.totalPages ?? 0;

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <SettingsNav />
        <Card>
          <p className="text-red-700">Apenas administradores podem configurar integrações.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <SettingsNav />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-brand-700">Integrações</p>
        <h1 className="text-3xl font-bold text-gray-900">Omie</h1>
        <p className="text-gray-600 max-w-3xl">
          Configure as credenciais da API do Omie, valide o acesso e monitore os eventos que o worker está processando.
          O scheduler reenvia eventos pendentes automaticamente, mas você pode acompanhar e reenfileirar manualmente quando necessário.
        </p>
      </div>

      {connectionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{connectionError}</div>
      )}
      {saveMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{saveMessage}</div>
      )}
      {testMessage && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            testMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {testMessage.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Status da Conexão</h2>
                <p className="text-sm text-gray-600">Saiba qual fonte está ativa e quando foi atualizada.</p>
              </div>
              <Button variant="ghost" onClick={loadConnection} disabled={connectionLoading}>
                {connectionLoading ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
            <ConnectionChip connection={connection} />
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Última atualização</dt>
                <dd className="text-sm font-medium text-gray-900">{connection?.updatedAt ? formatDate(connection.updatedAt) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Criado em</dt>
                <dd className="text-sm font-medium text-gray-900">{connection?.createdAt ? formatDate(connection.createdAt) : '—'}</dd>
              </div>
            </dl>
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Dicas rápidas</p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>É possível manter credenciais globais via ENV enquanto cada tenant migra para credenciais próprias.</li>
                <li>O scheduler roda a cada minuto e reenfileira eventos pendentes ou com erro.</li>
                <li>Use a tabela de auditoria abaixo para investigar falhas específicas.</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Credenciais & Teste</h2>
              <p className="text-sm text-gray-600">Informe um novo par de `appKey` e `appSecret` para este tenant.</p>
            </div>
            <div className="space-y-3">
              <label className="space-y-1 text-sm font-medium text-gray-700" htmlFor="omie-app-key">
                App Key
                <input
                  id="omie-app-key"
                  type="text"
                  value={form.appKey}
                  onChange={(event) => setForm((prev) => ({ ...prev, appKey: event.target.value }))}
                  placeholder="Ex.: 1234567890"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  autoComplete="off"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700" htmlFor="omie-app-secret">
                App Secret
                <input
                  id="omie-app-secret"
                  type="password"
                  value={form.appSecret}
                  onChange={(event) => setForm((prev) => ({ ...prev, appSecret: event.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  autoComplete="new-password"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar credenciais'}
              </Button>
              <Button variant="ghost" onClick={handleTest} disabled={testing}>
                {testing ? 'Testando...' : canTestWithOverride ? 'Testar com dados acima' : 'Testar credenciais salvas'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Nunca exibimos o segredo armazenado; informe um novo par completo sempre que precisar atualizar.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Eventos sincronizados</h2>
              <p className="text-sm text-gray-600">{activeFilterLabel} — página {page}{eventsMeta?.totalPages ? ` de ${eventsMeta.totalPages}` : ''}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {EVENT_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setEventFilter(filter.value);
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    eventFilter === filter.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
              <Button variant="ghost" onClick={loadEvents} disabled={eventsLoading}>
                {eventsLoading ? 'Atualizando...' : 'Recarregar'}
              </Button>
            </div>
          </div>

          {eventsError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{eventsError}</div>}

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Cliente / Serviço</th>
                  <th className="px-4 py-3 text-left">Tentativas</th>
                  <th className="px-4 py-3 text-left">Criado</th>
                  <th className="px-4 py-3 text-left">Última tentativa</th>
                  <th className="px-4 py-3 text-left">Erro</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eventsLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Carregando eventos...
                    </td>
                  </tr>
                )}
                {!eventsLoading && events.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Nenhum evento encontrado para este filtro.
                    </td>
                  </tr>
                )}
                {!eventsLoading &&
                  events.map((event) => {
                    const payload = event.payload as Record<string, any>;
                    const customer = payload?.customerName ?? '—';
                    const service = payload?.serviceId ?? '—';
                    return (
                      <tr key={event.id} className="bg-white">
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <EventStatusBadge status={event.status} />
                            <p className="text-xs text-gray-500">ID {event.id.slice(0, 8)}…</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-gray-900">{customer}</p>
                          <p className="text-xs text-gray-500">Serviço: {service}</p>
                          {payload?.petName && <p className="text-xs text-gray-500">Pet: {payload.petName}</p>}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-gray-900">{event.attemptCount}</p>
                          <p className="text-xs text-gray-500">Último código: {event.lastErrorCode ?? '—'}</p>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-gray-900">{formatDate(event.createdAt)}</td>
                        <td className="px-4 py-4 align-top text-sm text-gray-900">{formatDate(event.lastAttemptAt)}</td>
                        <td className="px-4 py-4 align-top text-xs text-gray-600">
                          {event.errorMessage ? (
                            <span className="line-clamp-3">{event.errorMessage}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => handleReprocess(event.id)}
                              disabled={reprocessingId === event.id || event.status === 'PROCESSING'}
                            >
                              {reprocessingId === event.id ? 'Reenfileirando…' : 'Reprocessar'}
                            </Button>
                            {event.appointmentId && (
                              <a
                                href={`/admin/appointments/${event.appointmentId}`}
                                className="text-xs font-medium text-brand-700 hover:underline"
                              >
                                Ver agendamento
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <p>
              {eventsMeta?.total ?? 0} evento(s) • Página {page}
              {totalPages ? ` de ${totalPages}` : ''}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
                Anterior
              </Button>
              <Button variant="ghost" onClick={() => setPage((prev) => (totalPages && prev < totalPages ? prev + 1 : prev))} disabled={totalPages === 0 || page >= totalPages}>
                Próxima
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
