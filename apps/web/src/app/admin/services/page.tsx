'use client';

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useServices } from '@/lib/hooks';
import { EmptyState, HeroSkeleton, ListSkeleton } from '@/components/feedback/VisualStates';

export default function ServicesPage() {
  const { services, isLoading, error, fetchServices } = useServices();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchServices();
  }, [fetchServices]);

  if (!mounted) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <HeroSkeleton />
        <ListSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <header className="page-header">
        <div className="page-header__meta">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Catálogo</p>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-base text-slate-500">
            Cadastre banhos, tosas e outros serviços do petshop para usar na agenda.
          </p>
        </div>
        <div className="page-header__actions">
          <Link href="/admin/services/new">
            <Button icon={<span aria-hidden>＋</span>}>Novo Serviço</Button>
          </Link>
        </div>
      </header>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Serviços', isCurrent: true },
        ]}
        note="Navegação comentada: a trilha mantém contexto ao alternar entre dashboard, serviços e agenda sem perda de estado."
      />

      {error && (
        <EmptyState
          variant="inline"
          mood="warning"
          icon="🧼"
          title="Não foi possível carregar os serviços"
          description={error}
          action={<Button variant="secondary" onClick={fetchServices}>Recarregar</Button>}
        />
      )}

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : services.length === 0 ? (
        <EmptyState
          icon="🛁"
          title="Nenhum serviço cadastrado"
          description="Cadastre banhos, tosas e atendimentos para usá-los na agenda."
          action={
            <Link href="/admin/services/new">
              <Button>Novo Serviço</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Serviços cadastrados</h2>
            <p className="text-sm text-slate-500">Ativos, duração e status aparecem abaixo.</p>
          </div>
          <div className="divide-y divide-surface-divider">
            {services.map((service) => (
              <div key={service.id} className="py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{service.name}</p>
                  {service.description && (
                    <p className="text-sm text-slate-500">{service.description}</p>
                  )}
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Duração base: {service.baseDurationMinutes} minutos
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    service.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
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
