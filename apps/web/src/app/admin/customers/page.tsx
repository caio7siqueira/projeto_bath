'use client';

import { useEffect, useState } from 'react';
import { useCustomers } from '@/lib/hooks';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import Link from 'next/link';

export default function CustomersPage() {
  const { customers, isLoading, error, fetchCustomers } = useCustomers();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, []);

  if (!mounted) return null;

  return (
    <Sidebar>
      <div className="p-4 md:p-8 max-w-6xl mx-auto pt-16 md:pt-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="mt-2 text-gray-600">
              Gerencie todos os clientes da sua barbearia
            </p>
          </div>
          <Link href="/admin/customers/new">
            <Button>Novo Cliente</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-gray-600">Carregando...</div>
        ) : customers.length === 0 ? (
          <Card>
            <CardHeader title="Nenhum cliente encontrado" />
            <p className="text-gray-600">
              Comece criando seu primeiro cliente.
            </p>
          </Card>
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
    </Sidebar>
  );
}
