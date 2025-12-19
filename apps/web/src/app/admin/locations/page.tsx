'use client';

import { useEffect } from 'react';
import { useLocations } from '@/lib/hooks';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export default function LocationsPage() {
  const { locations, isLoading, error, fetchLocations, createNewLocation } = useLocations();

  const locationSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
  });

  type LocationFormData = z.infer<typeof locationSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const onSubmit = async (data: LocationFormData) => {
    try {
      await createNewLocation({ name: data.name.trim() });
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Locais</h1>
        <p className="mt-2 text-gray-600">Cadastre e visualize os locais de atendimento.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Nome do local"
            id="name"
            placeholder="Unidade Centro"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Adicionar local
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        {isLoading ? (
          <div className="text-gray-600">Carregando...</div>
        ) : locations.length === 0 ? (
          <Card>
            <CardHeader title="Nenhum local cadastrado" />
            <p className="text-gray-600">Adicione o primeiro local para começar.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {locations.map((location) => (
              <Card key={location.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-600">ID: {location.id}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Ativo
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
