'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAppointments, useCustomers, usePets, useLocations } from '@/lib/hooks';
import type { Appointment } from '@/lib/api/appointments';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function statusLabel(status: Appointment['status']) {
  const labels: Record<Appointment['status'], string> = {
    SCHEDULED: 'Agendado',
    CANCELLED: 'Cancelado',
    COMPLETED: 'Concluído',
    DONE: 'Finalizado',
    RESCHEDULED: 'Reagendado',
    NO_SHOW: 'Falta',
  };
  return labels[status] || status;
}

export default function AppointmentsPage() {
  const {
    appointments,
    isLoading,
    error,
    fetchAppointments,
    cancelExistingAppointment,
  } = useAppointments();
  const { customers, fetchCustomers } = useCustomers();
  const { pets, fetchPets } = usePets();
  const { locations, fetchLocations } = useLocations();
  const [mounted, setMounted] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchAppointments();
    fetchCustomers();
    fetchPets();
    fetchLocations();
  }, []);

  const customerById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers]
  );
  const petById = useMemo(
    () => Object.fromEntries(pets.map((p) => [p.id, p.name])),
    [pets]
  );
  const locationById = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.id, l.name])),
    [locations]
  );

  const handleCancel = async (id: string) => {
    setCancelingId(id);
    try {
      await cancelExistingAppointment(id);
    } catch (err) {
      console.error(err);
    } finally {
      setCancelingId(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="mt-2 text-gray-600">
            Acompanhe e gerencie todos os agendamentos.
          </p>
        </div>
        <Link href="/admin/appointments/new">
          <Button>Novo Agendamento</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-600">Carregando...</div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardHeader title="Nenhum agendamento" />
          <p className="text-gray-600">Crie seu primeiro agendamento.</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pet</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Local</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Início</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fim</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {customerById[appointment.customerId] || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {appointment.petId ? petById[appointment.petId] || '—' : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {locationById[appointment.locationId] || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDateTime(appointment.startsAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDateTime(appointment.endsAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {statusLabel(appointment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/appointments/${appointment.id}`}>
                        <Button variant="secondary" size="sm">
                          Editar
                        </Button>
                      </Link>
                      {appointment.status !== 'CANCELLED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(appointment.id)}
                          isLoading={cancelingId === appointment.id}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
