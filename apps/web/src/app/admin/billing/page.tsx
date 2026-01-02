"use client";
"use client";


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, HeroSkeleton, SkeletonBlock } from '@/components/feedback/VisualStates';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useRole } from '@/lib/use-role';
import { fetchBillingSubscription, BillingSubscription } from '@/lib/api/billing';

function getTrialDaysLeft(trialEndsAt?: string) {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function BillingAdminPage() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchBillingSubscription()
      .then((data) => {
        setSubscription(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar assinatura');
        setSubscription(null);
      })
      .finally(() => setLoading(false));
  }, []);

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
    <div className="page-shell space-y-6">
      <header className="page-header">
        <div className="page-header__meta">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Assinatura</p>
          <h1 className="text-3xl font-bold">Billing e Assinatura</h1>
          <p className="text-base text-slate-500">Gerencie plano, trial e limites de uso.</p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => router.refresh()}>Atualizar</Button>
          <Button onClick={() => router.push('/admin/billing/checkout')} icon={<span aria-hidden>＋</span>}>
            Ativar / Trocar plano
          </Button>
        </div>
      </header>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Billing', isCurrent: true },
        ]}
        note="Navegação guiada: o caminho acima elimina recarregamentos completos e mantém o contexto quando você avança para checkout ou cancelamento."
      />
      {loading && (
        <Card>
          <HeroSkeleton />
          <div className="mt-6 space-y-3">
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
        </Card>
      )}
      {error && (
        <EmptyState
          variant="inline"
          mood="warning"
          icon="⚠️"
          title="Não foi possível carregar sua assinatura"
          description={error}
          action={
            <Button variant="secondary" onClick={() => router.refresh()}>
              Tentar novamente
            </Button>
          }
        />
      )}
      {!loading && !error && !subscription && (
        <EmptyState
          icon="💳"
          title="Nenhum plano ativo"
          description="Finalize o checkout para ativar o faturamento e liberar limites premium."
          action={
            <Button onClick={() => router.push('/admin/billing/checkout')}>
              Ativar assinatura
            </Button>
          }
        />
      )}
      {!loading && !error && subscription && (
        <Card header="Resumo da Assinatura">
          <div className="mb-2">
            <span className="font-semibold">Plano atual:</span> {subscription.plan}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Status:</span>{' '}
            {subscription.status === 'ACTIVE'
              ? 'Ativa'
              : subscription.status === 'PAST_DUE'
              ? 'Em atraso'
              : subscription.status === 'CANCELLED'
              ? 'Cancelada'
              : 'Inativa'}
          </div>
          {subscription.trialEndsAt && getTrialDaysLeft(subscription.trialEndsAt) !== null && (
            <div className="mb-2">
              <span className="font-semibold">Trial restante:</span> {getTrialDaysLeft(subscription.trialEndsAt)} dias
            </div>
          )}
          <div className="mb-2">
            <span className="font-semibold">Limite de uso:</span>{' '}
            <span className="text-yellow-700">Soft limit: 100 agendamentos/mês</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => router.push('/admin/billing/checkout')}>
              Upgrade / Trocar plano
            </Button>
            <Button variant="danger" onClick={() => router.push('/admin/billing/cancel')}>
              Cancelar assinatura
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
