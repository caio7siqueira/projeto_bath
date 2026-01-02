'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePets, useCustomers } from '@/lib/hooks';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField, SelectField } from '@/components/FormField';
import { ErrorBanner } from '@/components/feedback/VisualStates';
import { createFieldErrorMap, normalizeApiError } from '@/lib/api/errors';
import { petSchema, type PetFormData } from '@/lib/schemas';
import { z } from 'zod';

export default function PetFormPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params?.id as string | undefined;
  const isEditing = !!petId && petId !== 'new';
  const navigateToPets = () => router.push('/admin/pets');
  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      navigateToPets();
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    setError: setFormError,
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
  const [errorBanner, setErrorBanner] = useState<{ title: string; message: string; details?: string[] } | null>(null);
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
    setErrorBanner(null);

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
        setErrorBanner({
          title: 'Edição não disponível',
          message: 'Ainda não é possível atualizar um pet existente. Crie um novo cadastro.',
        });
        setIsSaving(false);
        return;
      } else {
        await createNewPet(data.customerId, submitData);
      }
      navigateToPets();
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível salvar o pet.');
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
        setFormError(field as keyof (PetFormData & { customerId: string }), { type: 'server', message });
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Pet' : 'Novo Pet'}
          </h1>
          <p className="text-xs text-gray-500 italic">
            Experiência guiada: o botão &ldquo;Voltar&rdquo; respeita o caminho percorrido antes de abrir este formulário.
          </p>
        </div>

        {errorBanner && (
          <ErrorBanner
            title={errorBanner.title}
            message={errorBanner.message}
            details={errorBanner.details}
            scenario="pets-create-validation"
          />
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
