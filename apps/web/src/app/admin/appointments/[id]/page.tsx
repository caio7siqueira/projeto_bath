'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormField, SelectField } from '@/components/FormField';
import { ErrorBanner } from '@/components/feedback/VisualStates';
import { useAppointments, useCustomers, usePets, useLocations } from '@/lib/hooks';
import { appointmentSchema, type AppointmentFormData } from '@/lib/schemas';
import { normalizeApiError } from '@/lib/api/errors';
import { cancelAppointmentSeries } from '@/lib/api/appointments-actions';

function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const statusOptions = [
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'DONE', label: 'Finalizado' },
];

export default function AppointmentFormPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.id as string | undefined;
  const isEditing = !!appointmentId && appointmentId !== 'new';
  const navigateToAppointments = () => router.push('/admin/appointments');
  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      navigateToAppointments();
    }
  };

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
      customerId: '',
      locationId: '',
      petId: '',
      serviceId: '',
      startsAt: '',
      endsAt: '',
      notes: '',
      status: 'SCHEDULED',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [bannerError, setBannerError] = useState<{ title?: string; message: string; details?: string[] } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isSeriesCanceling, setIsSeriesCanceling] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);

  const selectedCustomerId = watch('customerId');

  const filteredPets = useMemo(() => {
    if (!selectedCustomerId) return pets;
    return pets.filter((p) => p.customerId === selectedCustomerId);
  }, [pets, selectedCustomerId]);

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
    fetchLocations();

    const loadAppointment = async () => {
      if (!isEditing || !appointmentId) return;
      try {
        setBannerError(null);
        const appointment = await fetchAppointmentById(appointmentId);
        setAppointment(appointment);
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
        if (appointment.customerId) {
          fetchPets(appointment.customerId, { append: true });
        }
      } catch (err) {
        const parsed = normalizeApiError(err, 'Não foi possível carregar o agendamento.');
        setBannerError({ title: parsed.title, message: parsed.message });
      }
    };

    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, appointmentId]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    fetchPets(selectedCustomerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSaving(true);
    setBannerError(null);

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

      navigateToAppointments();
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível salvar o agendamento.');
      const details = parsed.details.filter((detail) => !detail.field).map((detail) => detail.message);
      setBannerError({
        title: parsed.title,
        message: parsed.message,
        details: details.length ? details : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!appointmentId) return;
    setIsCanceling(true);
    setBannerError(null);
    try {
      await cancelExistingAppointment(appointmentId);
      navigateToAppointments();
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível cancelar o agendamento.');
      setBannerError({ title: parsed.title, message: parsed.message });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleCancelSeries = async () => {
    if (!appointmentId) return;
    setIsSeriesCanceling(true);
    setBannerError(null);
    try {
      await cancelAppointmentSeries(appointmentId);
      navigateToAppointments();
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível cancelar os próximos horários da série.');
      setBannerError({ title: parsed.title, message: parsed.message });
    } finally {
      setIsSeriesCanceling(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
        </h1>
        <p className="text-gray-600">Preencha as informações do agendamento.</p>
        <p className="text-xs text-gray-500 italic">
          Navegação descrita: o retorno respeita seu histórico e mantém alterações locais intactas.
        </p>
      </div>

      {bannerError && (
        <div className="mb-6">
          <ErrorBanner
            scenario="appointments-edit"
            title={bannerError.title}
            message={bannerError.message}
            details={bannerError.details}
          />
        </div>
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

          {appointment?.recurrenceSeriesId && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 font-semibold">Recorrente</span>
              <span className="text-xs text-gray-500">Este agendamento faz parte de uma série recorrente.</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            <Button type="submit" isLoading={isSaving}>
              {isEditing ? 'Atualizar' : 'Criar'} Agendamento
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleGoBack}
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
            {isEditing && appointment?.recurrenceSeriesId && (
              <Button
                type="button"
                variant="danger"
                isLoading={isSeriesCanceling}
                disabled={isSeriesCanceling}
                onClick={() => {
                  if (window.confirm('Deseja cancelar toda a série recorrente? Isso afetará todos os agendamentos futuros.')) {
                    handleCancelSeries();
                  }
                }}
              >
                Cancelar série recorrente
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
