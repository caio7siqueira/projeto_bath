'use client';

import useSWR from 'swr';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ErrorBanner, SkeletonBlock } from '@/components/feedback/VisualStates';
import { normalizeApiError } from '@/lib/api/errors';

type LimitMap = Record<string, number>;

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch (err) {
      body = null;
    }
    throw { status: response.status, body };
  }
  return response.json();
};

export default function TenantLimits() {
  const limitsState = useSWR<LimitMap>('/v1/tenant/limits', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
  const usageState = useSWR<LimitMap>('/v1/tenant/usage', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const isLoading = limitsState.isLoading || usageState.isLoading;
  const hasError = limitsState.error || usageState.error;

  const handleRetry = () => {
    limitsState.mutate();
    usageState.mutate();
  };

  const handleUpgradeClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/billing';
    }
  };

  if (isLoading || !limitsState.data || !usageState.data) {
    return (
      <Card className="space-y-3">
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-5/6" />
      </Card>
    );
  }

  if (hasError) {
    const parsed = normalizeApiError(hasError, 'Não conseguimos carregar os limites do plano.');
    return (
      <ErrorBanner
        scenario="tenant-limits"
        title={parsed.title}
        message={parsed.message}
        details={parsed.details.filter((detail) => !detail.field).map((detail) => detail.message)}
        action={
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const limits = limitsState.data;
  const usage = usageState.data;
  const hiddenKeys = new Set(['automations']);
  const visibleKeys = Object.keys(limits).filter((key) => !hiddenKeys.has(key));
  const overLimitKeys = visibleKeys.filter((key) => (usage[key] ?? 0) > (limits[key] ?? 0));

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-500">Assinatura</p>
        <h2 className="text-xl font-semibold text-gray-900">Limites do plano</h2>
        <p className="text-sm text-gray-500">Monitoramos consumo em tempo real para evitar bloqueios inesperados.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2 font-medium">Recurso</th>
              <th className="pb-2 font-medium">Usado</th>
              <th className="pb-2 font-medium">Limite</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleKeys.map((key) => {
              const used = usage[key] ?? 0;
              const limit = limits[key] ?? 0;
              const isOver = used > limit;
              return (
                <tr key={key} className={`border-t border-slate-100 ${isOver ? 'bg-red-50' : ''}`}>
                  <td className="py-2 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                  <td className="py-2">{used}</td>
                  <td className="py-2">{limit}</td>
                  <td className="py-2">
                    {isOver ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        Excedido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Dentro do limite
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {overLimitKeys.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Alguns recursos excederam o limite: <strong>{overLimitKeys.join(', ')}</strong>
          <Button size="sm" onClick={handleUpgradeClick}>
            Upgrade de plano
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Tudo dentro dos limites contratados.
        </div>
      )}
      <p className="text-xs text-gray-400">Dados atualizados a cada poucos minutos. Testes internos simulam consumo para validação de UI.</p>
    </Card>
  );
}
