"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/feedback/VisualStates';
import { activateBillingPlan } from '@/lib/api/billing';
import { normalizeApiError } from '@/lib/api/errors';

export default function BillingCheckout() {
  const router = useRouter();
  const [plan, setPlan] = useState('STARTER');
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<{ title?: string; message: string; details?: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setBannerError(null);
    setSuccessMessage(null);
    try {
      await activateBillingPlan(plan);
      setSuccessMessage('Assinatura criada com sucesso!');
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível ativar a assinatura.');
      const nonFieldDetails = parsed.details.filter((detail) => !detail.field).map((detail) => detail.message);
      setBannerError({
        title: parsed.title,
        message: parsed.message,
        details: nonFieldDetails.length ? nonFieldDetails : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-8 max-w-md mx-auto p-4 border rounded-lg bg-white">
      <div className="mb-2 space-y-1">
        <h2 className="text-xl font-bold">Escolha seu plano</h2>
        <p className="text-xs text-gray-500 italic">
          Experiência orientada: o botão &ldquo;Voltar&rdquo; retorna ao fluxo anterior sem recarregar o app.
        </p>
      </div>
      <select
        className="border rounded px-2 py-1 mb-4 w-full"
        value={plan}
        onChange={e => setPlan(e.target.value)}
        disabled={loading}
      >
        <option value="STARTER">STARTER</option>
        <option value="PRO">PRO</option>
        <option value="FRANCHISE">FRANCHISE</option>
      </select>
      {bannerError && (
        <div className="mb-4">
          <ErrorBanner
            scenario="billing-checkout"
            title={bannerError.title}
            message={bannerError.message}
            details={bannerError.details}
          />
        </div>
      )}
      {successMessage && (
        <div className="mb-2 rounded-lg bg-green-50 p-3 text-green-700 text-sm font-medium">
          {successMessage}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="primary" onClick={handleCheckout} isLoading={loading} disabled={loading}>
          Assinar
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
