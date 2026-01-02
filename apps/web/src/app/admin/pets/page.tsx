'use client';

import { useEffect, useState } from 'react';
import { useCustomers, usePets } from '@/lib/hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { EmptyState, HeroSkeleton, ListSkeleton } from '@/components/feedback/VisualStates';


export default function PetsPage() {
  const { customers, isLoading: customersLoading, error: customersError, fetchCustomers } = useCustomers();
  const { pets, isLoading, error, fetchAllPets, fetchPets, pagination, user } = usePets();
  const [mounted, setMounted] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (!mounted) return;
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      fetchAllPets({ page: 1, pageSize: 20, q: search });
    } else if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
      fetchPets(customers[0].id);
    } else if (selectedCustomerId) {
      fetchPets(selectedCustomerId);
    }
  }, [customers, fetchAllPets, fetchPets, mounted, search, selectedCustomerId, user]);

  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!mounted) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <HeroSkeleton />
        <ListSkeleton rows={4} hasActions />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pets</h1>
          <p className="mt-2 text-gray-600">Gerencie os animais de estimação dos seus clientes.</p>
        </div>
        {(isAdminUser || customers.length > 0) && (
          <Link href="/admin/pets/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">+ Novo Pet</Button>
          </Link>
        )}
      </div>

      {isAdminUser ? (
        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nome</label>
            <input
              className="w-full md:w-80 rounded-lg border border-gray-300 px-4 py-2"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Digite o nome do pet"
            />
          </div>
        </div>
      ) : customers.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select
            className="w-full md:w-80 rounded-lg border border-gray-300 px-4 py-2"
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            disabled={customersLoading || isLoading}
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>
      )}

      {customersError && (
        <EmptyState
          variant="inline"
          mood="warning"
          icon="📇"
          title="Problema ao carregar clientes"
          description={customersError}
          action={<Button variant="secondary" onClick={fetchCustomers}>Recarregar clientes</Button>}
        />
      )}

      {error && (
        <EmptyState
          variant="inline"
          mood="warning"
          icon="🐾"
          title="Não foi possível carregar os pets"
          description={error}
          action={<Button variant="secondary" onClick={() => (isAdminUser ? fetchAllPets({ page: 1, pageSize: 20, q: search }) : selectedCustomerId ? fetchPets(selectedCustomerId) : undefined)}>Tentar novamente</Button>}
        />
      )}

      {isLoading ? (
        <ListSkeleton rows={4} hasActions />
      ) : pets.length === 0 ? (
        <EmptyState
          icon="🐕"
          title="Nenhum pet encontrado"
          description={
            isAdminUser ? 'Cadastre o primeiro pet para liberar histórico e agendamentos.' : 'Selecione um cliente ou cadastre um pet para começar.'
          }
          action={
            (isAdminUser || customers.length > 0) && (
              <Link href="/admin/pets/new">
                <Button>Novo Pet</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:gap-6">
          {pets.map((pet) => (
            <Card key={pet.id}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                  <p className="text-sm text-gray-600">{pet.species === 'DOG' ? '🐕 Cachorro' : '🐱 Gato'} • {pet.lifeStatus === 'ALIVE' ? 'Vivo' : 'Falecido'}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/pets/${pet.id}`}>
                    <Button variant="secondary" size="sm">Editar</Button>
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
