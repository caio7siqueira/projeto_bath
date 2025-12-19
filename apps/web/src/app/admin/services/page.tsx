'use client';

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { useServices } from '@/lib/hooks';

export default function ServicesPage() {
  const { services, isLoading, error, fetchServices } = useServices();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchServices();
  }, [fetchServices]);

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
          <p className="mt-2 text-gray-600">
            Cadastre banhos, tosas e outros serviços do petshop para usar na agenda.
          </p>
        </div>
        <Link href="/admin/services/new">
          <Button>Novo Serviço</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-yellow-800">{error}</div>
      )}

      {isLoading ? (
        <div className="text-gray-600">Carregando serviços...</div>
      ) : services.length === 0 ? (
        <Card>
          <CardHeader title="Nenhum serviço cadastrado" />
          <p className="text-gray-600">Crie seu primeiro serviço para usá-lo na agenda.</p>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Serviços cadastrados" />
          <div className="divide-y divide-gray-100">
            {services.map((service) => (
              <div key={service.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{service.name}</p>
                  {service.description && (
                    <p className="text-sm text-gray-600">{service.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Duração base: {service.baseDurationMinutes} minutos
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    service.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
