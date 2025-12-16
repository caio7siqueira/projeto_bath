'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCustomers } from '@/lib/hooks';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { customerSchema, type CustomerFormData } from '@/lib/schemas';

export default function CustomerFormPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string | undefined;
  const isEditing = !!customerId && customerId !== 'new';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const { customers, createNewCustomer, updateExistingCustomer } =
    useCustomers();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isEditing && customers.length > 0) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        reset({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          cpf: customer.cpf || '',
          optInGlobal: customer.optInGlobal,
        });
      }
    }
  }, [isEditing, customerId, customers, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await updateExistingCustomer(customerId, data);
      } else {
        await createNewCustomer(data);
      }
      router.push('/admin/customers');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <Sidebar>
      <div className="p-4 md:p-8 max-w-2xl mx-auto pt-16 md:pt-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="Nome"
              id="name"
              placeholder="João Silva"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <FormField
              label="Telefone"
              id="phone"
              placeholder="(11) 98765-4321"
              required
              error={errors.phone?.message}
              {...register('phone')}
            />

            <FormField
              label="Email"
              id="email"
              type="email"
              placeholder="joao@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <FormField
              label="CPF"
              id="cpf"
              placeholder="123.456.789-00"
              error={errors.cpf?.message}
              {...register('cpf')}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isSaving}>
                {isEditing ? 'Atualizar' : 'Criar'} Cliente
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/customers')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Sidebar>
  );
}
