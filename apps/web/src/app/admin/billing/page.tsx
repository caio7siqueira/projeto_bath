"use client";
"use client";


import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRole } from '@/lib/use-role';
import { useEffect, useState } from 'react';
import { fetchBillingSubscription, BillingSubscription } from '@/lib/api/billing';

function getTrialDaysLeft(trialEndsAt?: string) {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function BillingAdminPage() {
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing e Assinatura</h1>
      {loading && (
        <Card>
          <p className="text-gray-600">Carregando informações de assinatura...</p>
        </Card>
      )}
      {error && (
        <Card>
          <p className="text-red-700">{error}</p>
        </Card>
      )}
      {!loading && !error && !subscription && (
        <Card>
          <p className="text-gray-600">Nenhuma assinatura encontrada.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Tentar novamente</Button>
        </Card>
      )}
      {!loading && !error && subscription && (
        <Card header="Resumo da Assinatura">
          <div className="mb-2">
            <span className="font-semibold">Plano atual:</span> {subscription.plan}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Status:</span> {subscription.status === 'ACTIVE' ? 'Ativa' : subscription.status === 'PAST_DUE' ? 'Em atraso' : subscription.status === 'CANCELLED' ? 'Cancelada' : 'Inativa'}
          </div>
          {subscription.trialEndsAt && getTrialDaysLeft(subscription.trialEndsAt) !== null && (
            <div className="mb-2">
              <span className="font-semibold">Trial restante:</span> {getTrialDaysLeft(subscription.trialEndsAt)} dias
            </div>
          )}
          <div className="mb-2">
            <span className="font-semibold">Limite de uso:</span> <span className="text-yellow-700">Soft limit: 100 agendamentos/mês</span>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={() => window.location.href = '/admin/billing/checkout'}>Upgrade / Trocar plano</Button>
            <Button variant="danger" onClick={() => window.location.href = '/admin/billing/cancel'}>Cancelar assinatura</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
