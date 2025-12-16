'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePets, useCustomers } from '@/lib/hooks';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField, SelectField } from '@/components/FormField';
import { petSchema, type PetFormData } from '@/lib/schemas';

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
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      lifeStatus: 'ALIVE',
      allowNotifications: true,
    },
  });

  const { pets, createNewPet, updateExistingPet } = usePets();
  const { customers, fetchCustomers } = useCustomers();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
    if (isEditing && pets.length > 0) {
      const pet = pets.find((p) => p.id === petId);
      if (pet) {
        setSelectedCustomer(pet.customerId);
        reset({
          name: pet.name,
          species: pet.species,
          lifeStatus: pet.lifeStatus,
          allowNotifications: pet.allowNotifications,
        });
      }
    }
  }, [isEditing, petId, pets, fetchCustomers, reset]);

  const onSubmit = async (data: PetFormData) => {
    if (!selectedCustomer && !isEditing) {
      setError('Cliente é obrigatório');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await updateExistingPet(petId, data);
      } else {
        await createNewPet(selectedCustomer, data);
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
    <Sidebar>
      <div className="p-4 md:p-8 max-w-2xl mx-auto pt-16 md:pt-0">
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
                id="customer"
                required
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
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
    </Sidebar>
  );
}
