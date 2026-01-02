'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { ErrorBanner } from '@/components/feedback/VisualStates';
import { createFieldErrorMap, normalizeApiError } from '@/lib/api/errors';
import { useServices } from '@/lib/hooks';

const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().optional(),
  baseDurationMinutes: z.coerce.number().int().min(5, 'Mínimo de 5 minutos'),
  active: z.boolean().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function NewServicePage() {
  const router = useRouter();
  const { createNewService } = useServices();
  const [errorBanner, setErrorBanner] = useState<{ title?: string; message: string; details?: string[] } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      baseDurationMinutes: 30,
      active: true,
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    setErrorBanner(null);
    setSuccess(null);
    try {
      await createNewService({
        name: data.name,
        description: data.description || undefined,
        baseDurationMinutes: data.baseDurationMinutes,
        active: data.active,
      });
      setSuccess('Serviço criado com sucesso!');
      setTimeout(() => router.push('/admin/services'), 800);
    } catch (err: any) {
      const parsed = normalizeApiError(err, 'Não foi possível criar o serviço.');
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
        setFormError(field as keyof ServiceFormData, { type: 'server', message });
      });
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin/services');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Novo Serviço</h1>
          <p className="text-gray-600">
            Cadastre banhos, tosas ou consultas para usar nos agendamentos.
          </p>
          <p className="text-xs text-gray-500 italic">
            Registro da experiência: mantenha o fluxo com o botão &ldquo;Voltar&rdquo; sem perder campos preenchidos.
          </p>
        </div>
        <Button variant="secondary" type="button" onClick={handleGoBack}>
          Voltar
        </Button>
      </div>

      {errorBanner && (
        <ErrorBanner
          title={errorBanner.title}
          message={errorBanner.message}
          details={errorBanner.details}
          scenario="services-create-validation"
        />
      )}
      {success && <div className="rounded-lg bg-green-50 p-4 text-green-800">{success}</div>}

      <Card>
        <CardHeader title="Dados do serviço" />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Nome"
            id="name"
            placeholder="Banho completo"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <FormField
            label="Descrição (opcional)"
            id="description"
            placeholder="Detalhes do serviço"
            error={errors.description?.message}
            {...register('description')}
          />
          <FormField
            label="Duração base (minutos)"
            id="baseDurationMinutes"
            type="number"
            min={5}
            error={errors.baseDurationMinutes?.message}
            {...register('baseDurationMinutes', { valueAsNumber: true })}
          />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" {...register('active')} className="w-4 h-4" />
            <label htmlFor="active" className="text-sm text-gray-700">
              Ativo
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isSubmitting}>
              Criar Serviço
            </Button>
            <Button type="button" variant="secondary" onClick={handleGoBack}>
              Voltar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
