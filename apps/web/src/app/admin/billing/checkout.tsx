"use client";
import { useState } from 'react';
import { Button } from '@/components/Button';

export default function BillingCheckout() {
  const [plan, setPlan] = useState('STARTER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_code: plan }),
      });
      if (!res.ok) throw new Error('Falha ao criar assinatura');
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-8 max-w-md mx-auto p-4 border rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-2">Escolha seu plano</h2>
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
      {error && <div className="text-red-700 mb-2">{error}</div>}
      {success && <div className="text-green-700 mb-2">Assinatura criada com sucesso!</div>}
      <Button variant="primary" onClick={handleCheckout} isLoading={loading} disabled={loading}>
        Assinar
      </Button>
    </div>
  );
}
