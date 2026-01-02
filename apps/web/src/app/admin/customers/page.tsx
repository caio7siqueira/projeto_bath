'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomers } from '@/lib/hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, HeroSkeleton, ListSkeleton } from '@/components/feedback/VisualStates';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

export default function CustomersPage() {
  const { customers, isLoading, error, fetchCustomers } = useCustomers();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, [fetchCustomers]);

  if (!mounted) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <HeroSkeleton />
        <ListSkeleton rows={3} hasActions />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
        <header className="page-header">
          <div className="page-header__meta">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Clientes</p>
            <h1 className="text-3xl font-bold">Base de clientes</h1>
            <p className="text-base text-slate-500">
              Gerencie todos os clientes do seu petshop
            </p>
          </div>
          <div className="page-header__actions">
            <Link href="/admin/customers/new">
              <Button icon={<span aria-hidden>＋</span>}>Novo Cliente</Button>
            </Link>
          </div>
        </header>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Clientes', isCurrent: true },
          ]}
          note="Documentação de navegação: a trilha mostra o contexto e permite saltar entre dashboard e clientes sem recarregar o app."
        />

        {error && (
          <EmptyState
            variant="inline"
            mood="warning"
            icon="📵"
            title="Não conseguimos carregar os clientes"
            description={error}
            action={<Button variant="secondary" onClick={fetchCustomers}>Recarregar</Button>}
          />
        )}

        {isLoading ? (
          <ListSkeleton rows={4} hasActions />
        ) : customers.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="Ainda não há clientes cadastrados"
            description="Crie o primeiro cadastro para liberar histórico, pets e agendamentos."
            action={
              <Link href="/admin/customers/new">
                <Button>Adicionar contato</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:gap-6">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.name}
                    </h3>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                    {customer.email && (
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/customers/${customer.id}`}>
                      <Button variant="secondary" size="sm">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}
