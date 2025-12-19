'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePets, useCustomers } from '@/lib/hooks';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField, SelectField } from '@/components/FormField';
import { petSchema, type PetFormData } from '@/lib/schemas';
import { z } from 'zod';

export default function PetFormPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params?.id as string | undefined;
  const isEditing = !!petId && petId !== 'new';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PetFormData & { customerId: string }>({
    resolver: zodResolver(
      petSchema.extend({
        customerId:
          petId === 'new'
            ? z.string().min(1, 'Cliente é obrigatório')
            : z.string().optional(),
      })
    ),
    defaultValues: {
      name: '',
      species: 'DOG',
      lifeStatus: 'ALIVE',
      allowNotifications: true,
      customerId: '',
    },
  });

  const { pets, createNewPet, fetchPets, isLoading } = usePets();
  const { customers, fetchCustomers } = useCustomers();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removido selectedCustomer, usar customerId do useForm
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (!isEditing || !petId || customers.length === 0) return;
    const existing = pets.find((p) => p.id === petId);
    if (existing) {
      reset({
        name: existing.name,
        species: existing.species,
        lifeStatus: existing.lifeStatus,
        allowNotifications: existing.allowNotifications,
        customerId: existing.customerId,
      });
      return;
    }

    const loadPet = async () => {
      for (const customer of customers) {
        const loaded = await fetchPets(customer.id, { append: true });
        const match = loaded.find((p) => p.id === petId);
        if (match) {
          reset({
            name: match.name,
            species: match.species,
            lifeStatus: match.lifeStatus,
            allowNotifications: match.allowNotifications,
            customerId: match.customerId,
          });
          break;
        }
      }
    };

    loadPet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, petId, customers, pets]);

  const onSubmit = async (data: PetFormData & { customerId: string }) => {
    setIsSaving(true);
    setError(null);

    try {
      // Filter out empty optional fields
      const submitData: any = {
        name: data.name,
        species: data.species,
      };
      if (data.lifeStatus) submitData.lifeStatus = data.lifeStatus;
      if (data.allowNotifications !== undefined) submitData.allowNotifications = data.allowNotifications;

      if (isEditing) {
        // Atualização de pet não suportada pois não há endpoint
        setError('Atualização de pet não suportada.');
        setIsSaving(false);
        return;
      } else {
        await createNewPet(data.customerId, submitData);
      }
      router.push('/admin/pets');
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
            {isEditing ? 'Editar Pet' : 'Novo Pet'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <SelectField
                label="Cliente"
                id="customerId"
                required
                error={errors.customerId?.message}
                {...register('customerId')}
                options={customers.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            )}

            <FormField
              label="Nome do Pet"
              id="name"
              placeholder="Máximo"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <SelectField
              label="Espécie"
              id="species"
              required
              error={errors.species?.message}
              options={[
                { value: 'DOG', label: '🐕 Cachorro' },
                { value: 'CAT', label: '🐱 Gato' },
              ]}
              {...register('species')}
            />

            <SelectField
              label="Status"
              id="lifeStatus"
              options={[
                { value: 'ALIVE', label: 'Vivo' },
                { value: 'DECEASED', label: 'Falecido' },
              ]}
              {...register('lifeStatus')}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifications"
                {...register('allowNotifications')}
                className="w-4 h-4"
              />
              <label htmlFor="notifications" className="text-sm text-gray-700">
                Permitir notificações
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isSaving}>
                {isEditing ? 'Atualizar' : 'Criar'} Pet
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/pets')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
    </div>
  );
}
