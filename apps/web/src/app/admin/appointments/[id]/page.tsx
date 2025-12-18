'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormField, SelectField } from '@/components/FormField';
import { useAppointments, useCustomers, usePets, useLocations } from '@/lib/hooks';
import { appointmentSchema, type AppointmentFormData } from '@/lib/schemas';

function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const statusOptions = [
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'DONE', label: 'Finalizado' },
  { value: 'RESCHEDULED', label: 'Reagendado' },
  { value: 'NO_SHOW', label: 'Falta' },
];

export default function AppointmentFormPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.id as string | undefined;
  const isEditing = !!appointmentId && appointmentId !== 'new';

  const {
    fetchAppointmentById,
    createNewAppointment,
    updateExistingAppointment,
    cancelExistingAppointment,
  } = useAppointments();
  const { customers, fetchCustomers } = useCustomers();
  const { pets, fetchPets, error: petsError } = usePets();
  const { locations, fetchLocations } = useLocations();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      startsAt: '',
      endsAt: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const selectedCustomerId = watch('customerId');

  const filteredPets = useMemo(() => {
    if (!selectedCustomerId) return pets;
    return pets.filter((p) => p.customerId === selectedCustomerId);
  }, [pets, selectedCustomerId]);

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
    fetchPets();
    fetchLocations();

    const loadAppointment = async () => {
      if (!isEditing || !appointmentId) return;
      try {
        const appointment = await fetchAppointmentById(appointmentId);
        reset({
          customerId: appointment.customerId,
          locationId: appointment.locationId,
          petId: appointment.petId || '',
          serviceId: appointment.serviceId || '',
          startsAt: toDatetimeLocal(appointment.startsAt),
          endsAt: toDatetimeLocal(appointment.endsAt),
          notes: appointment.notes || '',
          status: appointment.status,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar agendamento';
        setError(message);
      }
    };

    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, appointmentId]);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: new Date(data.endsAt).toISOString(),
        notes: data.notes || undefined,
      };

      if (isEditing && appointmentId) {
        await updateExistingAppointment(appointmentId, {
          ...payload,
          status: data.status,
        });
      } else {
        await createNewAppointment({
          customerId: data.customerId,
          locationId: data.locationId,
          petId: data.petId || undefined,
          serviceId: data.serviceId || undefined,
          ...payload,
        });
      }

      router.push('/admin/appointments');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar agendamento';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!appointmentId) return;
    setIsCanceling(true);
    try {
      await cancelExistingAppointment(appointmentId);
      router.push('/admin/appointments');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar agendamento';
      setError(message);
    } finally {
      setIsCanceling(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
        </h1>
        <p className="mt-2 text-gray-600">Preencha as informações do agendamento.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectField
            label="Cliente"
            id="customerId"
            required
            error={errors.customerId?.message}
            disabled={isEditing}
            {...register('customerId')}
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
          />

          {/* UX degradável para pets */}
          {petsError ? (
            <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-yellow-800">
              Não foi possível carregar pets. Você pode cadastrar depois.
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800 flex items-center justify-between">
              Nenhum pet cadastrado ainda.
              <span className="ml-2 text-xs">Você pode cadastrar depois.</span>
            </div>
          ) : (
            <SelectField
              label="Pet"
              id="petId"
              error={errors.petId?.message}
              disabled={isEditing && !watch('petId')}
              {...register('petId')}
              options={filteredPets.map((p) => ({ value: p.id, label: p.name }))}
            />
          )}

          <SelectField
            label="Local"
            id="locationId"
            required
            error={errors.locationId?.message}
            disabled={isEditing}
            {...register('locationId')}
            options={locations.map((l) => ({ value: l.id, label: l.name }))}
          />

          <FormField
            label="Serviço (opcional)"
            id="serviceId"
            placeholder="Banho, tosa, consulta..."
            error={errors.serviceId?.message}
            disabled={isEditing}
            {...register('serviceId')}
          />

          <FormField
            label="Início"
            id="startsAt"
            type="datetime-local"
            required
            error={errors.startsAt?.message}
            {...register('startsAt')}
          />

          <FormField
            label="Fim"
            id="endsAt"
            type="datetime-local"
            required
            error={errors.endsAt?.message}
            {...register('endsAt')}
          />

          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Observações
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className={`mt-1 w-full rounded-lg border px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                errors.notes
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>

          {isEditing && (
            <SelectField
              label="Status"
              id="status"
              error={errors.status?.message}
              {...register('status')}
              options={statusOptions}
            />
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            <Button type="submit" isLoading={isSaving}>
              {isEditing ? 'Atualizar' : 'Criar'} Agendamento
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/appointments')}
            >
              Voltar
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="danger"
                onClick={handleCancel}
                isLoading={isCanceling}
              >
                Cancelar agendamento
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
