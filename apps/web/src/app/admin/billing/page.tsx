"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRole } from '@/lib/use-role';
import {
  fetchBillingSubscription,
  upsertBillingSubscription,
  type BillingSubscription,
  type BillingStatus,
} from '@/lib/api/billing';

const statusOptions: BillingStatus[] = ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'INACTIVE'];

export default function BillingAdminPage() {
  const { isAdmin } = useRole();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState<BillingStatus>('INACTIVE');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await fetchBillingSubscription();
      setSubscription(current);
      if (current) {
        setPlan(current.plan);
        setStatus(current.status);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar assinatura';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await upsertBillingSubscription({ plan, status });
      setSubscription(saved);
      setSuccess('Assinatura salva com sucesso');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar assinatura';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Card>
          <p className="text-red-700">Apenas administradores podem acessar esta página.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Billing e Assinatura</h1>
        <p className="text-gray-600">Gerencie o plano e o status de cobrança deste tenant.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-sm text-gray-600">Última atualização</p>
            <p className="text-sm font-mono text-gray-800">
              {subscription?.updatedAt ? new Date(subscription.updatedAt).toLocaleString() : '—'}
            </p>
          </div>
          <Button variant="secondary" onClick={load} disabled={loading}>
            Recarregar
          </Button>
        </div>

        {error && <div className="rounded bg-red-50 p-3 text-red-700 mb-4">{error}</div>}
        {success && <div className="rounded bg-green-50 p-3 text-green-700 mb-4">{success}</div>}

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700">Plano</label>
            <input
              type="text"
              className="rounded-lg border border-gray-300 p-2"
              placeholder="ex.: standard, pro"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700">Status</label>
            <select
              className="rounded-lg border border-gray-300 p-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as BillingStatus)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              ACTIVE permite agendar; PAST_DUE ou CANCELLED bloqueia operações sensíveis.
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || loading || !plan}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="secondary" onClick={() => load()} disabled={loading}>
              Descartar alterações
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
