'use client';

import { useEffect, useState } from 'react';
import { useCustomers, usePets } from '@/lib/hooks';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import Link from 'next/link';

export default function PetsPage() {
  const { customers, isLoading: customersLoading, error: customersError, fetchCustomers } = useCustomers();
  const { pets, isLoading, error, fetchPets } = usePets();
  const [mounted, setMounted] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
      fetchPets(customers[0].id);
    } else if (selectedCustomerId) {
      fetchPets(selectedCustomerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId, customers, mounted]);

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pets</h1>
            <p className="mt-2 text-gray-600">
              Gerencie os animais de estimação dos seus clientes.
            </p>
          </div>
          {/* Botão de novo pet removido pois rota não existe */}
        </div>

        {customersError && (
          <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-yellow-800">
            Não foi possível carregar clientes. Recarregue a página ou tente novamente.
          </div>
        )}
        {customers.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              className="w-full md:w-80 rounded-lg border border-gray-300 px-4 py-2"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              disabled={customersLoading || isLoading}
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {customers.length === 0 ? (
          <Card>
            <CardHeader title="Nenhum cliente encontrado" />
            <p className="text-gray-600">Cadastre um cliente antes de vincular pets.</p>
          </Card>
        ) : isLoading ? (
          <div className="text-center text-gray-600">Carregando...</div>
        ) : pets.length === 0 ? (
          <Card>
            <CardHeader title="Nenhum pet encontrado" />
            <p className="text-gray-600">Selecione um cliente ou cadastre o primeiro pet.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {pets.map((pet) => (
              <Card key={pet.id}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pet.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pet.species === 'DOG' ? '🐕 Cachorro' : '🐱 Gato'} •{' '}
                      {pet.lifeStatus === 'ALIVE' ? 'Vivo' : 'Falecido'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/pets/${pet.id}`}>
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
