"use client";
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorBanner } from '@/components/feedback/VisualStates';
import { cancelBillingPlan, fetchBillingSubscription } from '@/lib/api/billing';
import type { BillingSubscription } from '@/lib/api/billing';
import { normalizeApiError } from '@/lib/api/errors';
import { useRole } from '@/lib/use-role';

export default function BillingCancel() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [bannerError, setBannerError] = useState<{ title?: string; message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    setLoadingSubscription(true);
    setBannerError(null);
    try {
      const data = await fetchBillingSubscription();
      setSubscription(data);
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível carregar sua assinatura.');
      setBannerError({ title: parsed.title, message: parsed.message });
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadSubscription();
  }, [isAdmin, loadSubscription]);

  const handleCancel = async () => {
    if (!subscription?.plan) {
      setBannerError({ title: 'Assinatura não encontrada', message: 'Nenhum plano ativo foi localizado para cancelamento.' });
      return;
    }
    setLoading(true);
    setBannerError(null);
    setSuccessMessage(null);
    try {
      await cancelBillingPlan(subscription.plan);
      setSuccessMessage('Assinatura cancelada com sucesso. Você pode reativá-la a qualquer momento.');
      await loadSubscription();
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível cancelar a assinatura.');
      const details = parsed.details.filter((detail) => !detail.field).map((detail) => detail.message);
      setBannerError({
        title: parsed.title,
        message: parsed.message,
        details: details.length ? details : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="my-8 max-w-md mx-auto">
        <p className="text-sm text-red-700">Somente administradores podem cancelar planos de assinatura.</p>
      </Card>
    );
  }

  return (
    <div className="my-8 max-w-md mx-auto p-4 border rounded-lg bg-white">
      <div className="mb-2 space-y-1">
        <h2 className="text-xl font-bold">Cancelar assinatura</h2>
        <p className="text-xs text-gray-500 italic">
          Navegação registrada: use &ldquo;Voltar&rdquo; para retornar ao ponto anterior sem atualizar a página inteira.
        </p>
      </div>
      {subscription && (
        <p className="text-sm text-gray-600 mb-4">
          Plano atual: <strong>{subscription.plan}</strong> • Status: <strong>{subscription.status}</strong>
        </p>
      )}
      {bannerError && (
        <div className="mb-4">
          <ErrorBanner
            scenario="billing-cancel"
            title={bannerError.title}
            message={bannerError.message}
            details={bannerError.details}
          />
        </div>
      )}
      {successMessage && (
        <div className="mb-3 rounded-lg bg-green-50 p-3 text-green-700 text-sm font-medium">
          {successMessage}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          variant="danger"
          onClick={handleCancel}
          isLoading={loading || loadingSubscription}
          disabled={loading || loadingSubscription}
        >
          Cancelar assinatura
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/admin/billing');
            }
          }}
        >
          Voltar
        </Button>
      </div>
    </div>
  );
}
