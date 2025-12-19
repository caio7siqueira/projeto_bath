"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { useCustomers, usePets, useLocations, useServices, useAppointments } from '@/lib/hooks';
import { appointmentSchema, AppointmentFormData } from '@/lib/schemas';

export default function NewAppointmentPage() {
  const { customers } = useCustomers();
  const { pets } = usePets();
  const { locations } = useLocations();
  const { services } = useServices();
  const { createNewAppointment } = useAppointments();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData & {
    recurrence: boolean;
    recurrenceRule: string;
    recurrenceInterval: number;
    recurrenceEndDate: string;
  }>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: '',
      petId: '',
      locationId: '',
      serviceId: '',
      startsAt: '',
      endsAt: '',
      notes: '',
      recurrence: false,
      recurrenceRule: 'WEEKLY',
      recurrenceInterval: 1,
      recurrenceEndDate: '',
    },
  });
  const recurrence = watch('recurrence');
  const recurrenceRule = watch('recurrenceRule');
  // useState para erro já declarado abaixo, não duplicar

  const [error, setError] = useState('');
  const onSubmit = async (data: any) => {
    setError('');
    try {
      if (data.recurrence) {
        await fetch('/v1/recurrence-series', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rule: data.recurrenceRule,
            interval: data.recurrenceRule === 'CUSTOM_INTERVAL' ? Number(data.recurrenceInterval) : undefined,
            startDate: data.startsAt,
            endDate: data.recurrenceEndDate,
            locationId: data.locationId,
            customerId: data.customerId,
            petId: data.petId,
            serviceId: data.serviceId,
          }),
        });
      } else {
        await createNewAppointment(data);
      }
      window.location.href = '/admin/appointments';
    } catch (err: any) {
      setError(err.message || 'Erro ao criar agendamento');
    }
  };

  return (
    <form className="max-w-xl mx-auto p-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-2xl font-bold">Novo Agendamento</h2>
      {/* Campos de seleção: cliente, pet, serviço, local, datas */}
      {/* Exemplo de campo com validação: */}
      <div>
        <label>Cliente</label>
        <select {...register('customerId')} className="border rounded p-2">
          <option value="">Selecione</option>
          {customers?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.customerId && <span className="text-red-600">{errors.customerId.message}</span>}
      </div>
      <div>
        <label>Pet</label>
        <select {...register('petId')} className="border rounded p-2">
          <option value="">Selecione</option>
          {pets?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.petId && <span className="text-red-600">{errors.petId.message}</span>}
      </div>
      <div>
        <label>Serviço</label>
        <select {...register('serviceId')} className="border rounded p-2">
          <option value="">Selecione</option>
          {services?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {errors.serviceId && <span className="text-red-600">{errors.serviceId.message}</span>}
      </div>
      <div>
        <label>Local</label>
        <select {...register('locationId')} className="border rounded p-2">
          <option value="">Selecione</option>
          {locations?.map((l: any) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        {errors.locationId && <span className="text-red-600">{errors.locationId.message}</span>}
      </div>
      <div>
        <label>Início</label>
        <input type="datetime-local" {...register('startsAt')} className="border rounded p-2" />
        {errors.startsAt && <span className="text-red-600">{errors.startsAt.message}</span>}
      </div>
      <div>
        <label>Fim</label>
        <input type="datetime-local" {...register('endsAt')} className="border rounded p-2" />
        {errors.endsAt && <span className="text-red-600">{errors.endsAt.message}</span>}
      </div>
      <div>
        <label>Observações</label>
        <input type="text" {...register('notes')} className="border rounded p-2" />
        {errors.notes && <span className="text-red-600">{errors.notes.message}</span>}
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register('recurrence')} />
        Recorrente
      </label>
      {recurrence && (
        <div className="space-y-2">
          <select {...register('recurrenceRule')} className="border rounded p-2">
            <option value="WEEKLY">Semanal</option>
            <option value="BIWEEKLY">Quinzenal</option>
            <option value="MONTHLY">Mensal</option>
            <option value="CUSTOM_INTERVAL">Intervalo customizado</option>
          </select>
          {recurrenceRule === 'CUSTOM_INTERVAL' && (
            <input type="number" {...register('recurrenceInterval', { valueAsNumber: true })} min={1} className="border rounded p-2" placeholder="Intervalo em dias" />
          )}
          <input type="date" {...register('recurrenceEndDate')} className="border rounded p-2" placeholder="Data final" />
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
    </form>
  );
}
