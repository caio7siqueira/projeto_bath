'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { CardGridSkeleton, ErrorBanner, HeroSkeleton, SkeletonBlock } from '@/components/feedback/VisualStates';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { fetchDashboardReports, type DashboardStats } from '@/lib/api/dashboard';
import { normalizeApiError } from '@/lib/api/errors';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalPets: 0,
    totalAppointments: 0,
    totalLocations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<{ title?: string; message: string } | null>(null);
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const data = await fetchDashboardReports();
      setStats(data);
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não conseguimos carregar o dashboard.');
      setErrorBanner({ title: parsed.title, message: parsed.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <div className="page-header__meta">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Resumo</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-base text-slate-500">
            Visão geral rápida dos principais indicadores do petshop.
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={fetchStats} aria-label="Atualizar indicadores">
            Atualizar dados
          </Button>
          <Button
            onClick={() => router.push('/admin/customers/new')}
            icon={<span aria-hidden>＋</span>}
          >
            Novo cliente
          </Button>
        </div>
      </header>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', isCurrent: true },
        ]}
        note="Trilha persistente: você sai para clientes, serviços ou agenda sem recarregar a página e pode voltar com o navegador."
      />

      {loading && (
        <div className="space-y-8">
          <HeroSkeleton />
          <CardGridSkeleton items={4} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <div className="space-y-3">
                <SkeletonBlock className="h-5 w-28" />
                <SkeletonBlock className="h-12 w-full" />
              </div>
            </Card>
            <Card>
              <div className="space-y-3">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-5/6" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {!loading && errorBanner && (
        <div className="space-y-4">
          <ErrorBanner
            scenario="dashboard-load"
            title={errorBanner.title}
            message={errorBanner.message}
            action={
              <Button onClick={fetchStats} variant="secondary">
                Tentar novamente
              </Button>
            }
          />
        </div>
      )}

      {!loading && !errorBanner && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <p className="text-sm font-medium text-slate-500">Total de Clientes</p>
              <p className="mt-3 text-4xl font-bold text-brand-600">{stats.totalCustomers}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm font-medium text-slate-500">Total de Pets</p>
              <p className="mt-3 text-4xl font-bold text-emerald-600">{stats.totalPets}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm font-medium text-slate-500">Agendamentos</p>
              <p className="mt-3 text-4xl font-bold text-purple-600">{stats.totalAppointments}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm font-medium text-slate-500">Locais</p>
              <p className="mt-3 text-4xl font-bold text-orange-500">{stats.totalLocations}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card header="Ações rápidas">
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => router.push('/admin/customers/new')}
                >
                  Novo Cliente
                </Button>
              </div>
            </Card>

            <Card header="Bem-vindo">
              <p className="mb-4 text-slate-600">
                Use o menu lateral para navegar entre clientes, pets e agenda. Os números acima ajudam a
                guiar suas próximas ações.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>✓ Base consolidada de clientes e pets</li>
                <li>✓ Indicadores de agendamentos ativos</li>
                <li>• Em breve: visão detalhada de locais e fila de serviços</li>
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
