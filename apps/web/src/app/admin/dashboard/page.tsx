'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';


interface DashboardStats {
  totalCustomers: number;
  totalPets: number;
  totalAppointments: number;
  totalLocations: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalPets: 0,
    totalAppointments: 0,
    totalLocations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usa client centralizado
        const data = await import('@/lib/api').then(m => m.apiFetch('/dashboard/reports'));
        setStats(data);
      } catch (err) {
        const errorMsg = err && typeof err === 'object' && 'message' in err ? (err as any).message : 'Erro ao carregar dashboard';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <Card>
          <p className="text-red-600">Erro: {error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Total de Clientes</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalCustomers}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Total de Pets</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalPets}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Agendamentos</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalAppointments}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Locais</p>
            <p className="text-3xl font-bold text-orange-600">{stats.totalLocations}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card header="Ações Rápidas">
          <div className="space-y-3">
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => window.location.href = '/admin/customers/new'}
            >
              Novo Cliente
            </Button>
            {/* Botão Novo Pet removido pois rota não existe */}
          </div>
        </Card>

        <Card header="Bem-vindo">
          <p className="text-gray-600 mb-4">
            Sistema de gestão para petshop, banho & tosa e clínica veterinária. Use o menu lateral para navegar entre as seções.
          </p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>✓ Clientes - Gerencie sua base de clientes</li>
            <li>✓ Pets - Cadastro e histórico de pets</li>
            <li>• Agendamentos - Em breve</li>
            <li>• Locais - Em breve</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
