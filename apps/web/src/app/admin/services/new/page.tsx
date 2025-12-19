'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
    setError(null);
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
      const message = err?.message || 'Erro ao criar serviço';
      setError(message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Serviço</h1>
          <p className="mt-2 text-gray-600">
            Cadastre banhos, tosas ou consultas para usar nos agendamentos.
          </p>
        </div>
        <Link href="/admin/services">
          <Button variant="secondary">Voltar</Button>
        </Link>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>}
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
            <Button type="button" variant="secondary" onClick={() => router.push('/admin/services')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
