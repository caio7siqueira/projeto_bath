'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { ErrorBanner } from '@/components/feedback/VisualStates';
import { createFieldErrorMap, normalizeApiError } from '@/lib/api/errors';
import { useCustomers } from '@/lib/hooks';
import { customerSchema, type CustomerFormData } from '@/lib/schemas';

export default function NewCustomerPage() {
  const router = useRouter();
  const { createNewCustomer } = useCustomers();
  const [isSaving, setIsSaving] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{ title: string; message: string; details?: string[] } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitted },
    reset,
    setError: setFormError,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      cpf: '',
      optInGlobal: false,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

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

  const onSubmit = async (data: CustomerFormData) => {
    setIsSaving(true);
    setErrorBanner(null);
    setSuccess(null);

    try {
      const submitData: CustomerFormData = {
        name: data.name,
        phone: data.phone,
      };
      if (data.email) submitData.email = data.email;
      if (data.cpf) submitData.cpf = data.cpf;
      if (data.optInGlobal !== undefined) submitData.optInGlobal = data.optInGlobal;

      await createNewCustomer(submitData);
      setSuccess('Cliente criado com sucesso!');
      reset({
        name: '',
        phone: '',
        email: '',
        cpf: '',
        optInGlobal: false,
      });
      setTimeout(() => router.push('/admin/customers'), 1200);
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível salvar o cliente.');
      const nonFieldMessages = parsed.details
        .filter((detail) => !detail.field)
        .map((detail) => detail.message);
      setErrorBanner({
        title: parsed.title,
        message: parsed.message,
        details: nonFieldMessages.length ? nonFieldMessages : undefined,
      });
      const fieldErrors = createFieldErrorMap(parsed.details);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setFormError(field as keyof CustomerFormData, { type: 'server', message });
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin/customers');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Novo Cliente</h1>
        <p className="text-xs text-gray-500 italic">
          Navegação orientada: o botão &ldquo;Voltar&rdquo; respeita seu histórico e retorna ao ponto exato da jornada.
        </p>
      </div>
      {errorBanner && (
        <ErrorBanner
          title={errorBanner.title}
          message={errorBanner.message}
          scenario="customers-create-invalid-data"
          details={errorBanner.details}
        />
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800 animate-fade-in">
          {success}
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
              Criar Cliente
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleGoBack}
            >
              Voltar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
