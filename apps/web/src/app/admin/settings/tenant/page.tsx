'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRole } from '@/lib/use-role';
import {
  fetchTenantConfig,
  updateTenantConfig,
  type TenantConfig,
} from '@/lib/api/tenant-config';

export default function TenantSettingsPage() {
  const { isAdmin } = useRole();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    reminderEnabled: true,
    reminderHoursBefore: 24,
    cancelWindowHours: 2,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTenantConfig();
        setConfig(data);
        setForm({
          reminderEnabled: data.reminderEnabled,
          reminderHoursBefore: data.reminderHoursBefore,
          cancelWindowHours: data.cancelWindowHours,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar config';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (form.reminderHoursBefore <= 0) {
      setError('Horas de lembrete deve ser maior que zero');
      setSaving(false);
      return;
    }
    if (form.cancelWindowHours < 0) {
      setError('Janela de cancelamento não pode ser negativa');
      setSaving(false);
      return;
    }

    try {
      const updated = await updateTenantConfig(form);
      setConfig(updated);
      setSuccess('Configurações salvas com sucesso');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar config';
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações do Tenant</h1>
        <p className="text-gray-600 mt-2">
          Ajuste lembretes e políticas de cancelamento para este tenant.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">{success}</div>
      )}

      <Card>
        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">Lembretes habilitados</p>
                <p className="text-sm text-gray-600">Envio de SMS/WhatsApp antes dos agendamentos.</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.reminderEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, reminderEnabled: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="reminderHoursBefore">
                  Horas antes para lembrar
                </label>
                <input
                  id="reminderHoursBefore"
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
                  value={form.reminderHoursBefore}
                  onChange={(e) => setForm((f) => ({ ...f, reminderHoursBefore: Number(e.target.value) }))}
                />
                <p className="text-xs text-gray-500">Padrão: 24h antes do horário do agendamento.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="cancelWindowHours">
                  Janela de cancelamento (horas)
                </label>
                <input
                  id="cancelWindowHours"
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
                  value={form.cancelWindowHours}
                  onChange={(e) => setForm((f) => ({ ...f, cancelWindowHours: Number(e.target.value) }))}
                />
                <p className="text-xs text-gray-500">Tempo mínimo antes do horário para permitir cancelamento.</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
