'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCustomers } from '@/lib/hooks';
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
    control,
    formState: { errors, touchedFields, isSubmitted },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      cpf: '',
      optInGlobal: false,
    },
  });

  const { customers, createNewCustomer, updateExistingCustomer } =
    useCustomers();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

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
      // Filter out empty optional fields
      const submitData: any = {
        name: data.name,
        phone: data.phone,
      };
      if (data.email) submitData.email = data.email;
      if (data.cpf) submitData.cpf = data.cpf;
      if (data.optInGlobal !== undefined) submitData.optInGlobal = data.optInGlobal;

      if (isEditing) {
        await updateExistingCustomer(customerId, submitData);
      } else {
        await createNewCustomer(submitData);
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
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
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
              touched={touchedFields.name || isSubmitted}
              {...register('name')}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Telefone"
                  id="phone"
                  placeholder="(11) 98765-4321"
                  required
                  error={errors.phone?.message}
                  touched={touchedFields.phone || isSubmitted}
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  ref={field.ref}
                />
              )}
            />

            <FormField
              label="Email"
              id="email"
              type="email"
              placeholder="joao@example.com"
              error={errors.email?.message}
              touched={touchedFields.email || isSubmitted}
              {...register('email')}
            />

            <Controller
              name="cpf"
              control={control}
              render={({ field }) => (
                <FormField
                  label="CPF"
                  id="cpf"
                  placeholder="123.456.789-00"
                  error={errors.cpf?.message}
                  touched={touchedFields.cpf || isSubmitted}
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(formatCpf(e.target.value))}
                  ref={field.ref}
                />
              )}
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
  );
}
