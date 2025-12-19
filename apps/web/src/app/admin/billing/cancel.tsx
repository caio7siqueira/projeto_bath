"use client";
import { useState } from 'react';
import { Button } from '@/components/Button';

export default function BillingCancel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/v1/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Falha ao cancelar assinatura');
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-8 max-w-md mx-auto p-4 border rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-2">Cancelar assinatura</h2>
      {error && <div className="text-red-700 mb-2">{error}</div>}
      {success && <div className="text-green-700 mb-2">Assinatura cancelada com sucesso!</div>}
      <Button variant="danger" onClick={handleCancel} isLoading={loading} disabled={loading}>
        Cancelar assinatura
      </Button>
    </div>
  );
}
