'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAppointments, useCustomers, usePets, useLocations, useServices } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import type { Appointment } from '@/lib/api/appointments';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';


const statusColors: Record<Appointment['status'], string> = {
  SCHEDULED: '#2563eb', // azul
  CANCELLED: '#ef4444', // vermelho
  COMPLETED: '#22c55e', // verde
  DONE: '#22c55e',
  RESCHEDULED: '#f59e42', // laranja
  NO_SHOW: '#a3a3a3', // cinza
};

export default function AppointmentsPage() {
  const {
    appointments,
    isLoading,
    error,
    fetchAppointments,
    cancelExistingAppointment,
  } = useAppointments();
  const { updateAppointmentInStore } = useAppStore();
  const { customers, fetchCustomers } = useCustomers();
  const { pets, fetchPets } = usePets();
  const { locations, fetchLocations } = useLocations();
    const { services, fetchServices } = useServices();
  const [mounted, setMounted] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchAppointments();
    fetchCustomers();
    fetchPets();
    fetchLocations();
    fetchServices();
  }, []);


  const customerById = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c.name])), [customers]);
  const petById = useMemo(() => Object.fromEntries(pets.map((p) => [p.id, p.name])), [pets]);
  const locationById = useMemo(() => Object.fromEntries(locations.map((l) => [l.id, l.name])), [locations]);
  const serviceById = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s.name])), [services]);

  const handleCancel = async (id: string) => {
    setActioningId(id);
    try {
      await cancelExistingAppointment(id);
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkDone = async (id: string) => {
    setActioningId(id);
    try {
      const { markAppointmentDone } = await import('@/lib/api/appointments-actions');
      const updated = await markAppointmentDone(id);
      // Atualizar na store manualmente
      updateAppointmentInStore(id, updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkNoShow = async (id: string) => {
    setActioningId(id);
    try {
      const { markAppointmentNoShow } = await import('@/lib/api/appointments-actions');
      const updated = await markAppointmentNoShow(id);
      updateAppointmentInStore(id, updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  if (!mounted) return null;

  // Mapeia agendamentos para eventos do FullCalendar
  const events = appointments.map((a) => ({
    id: a.id,
    title: `${customerById[a.customerId] || 'Cliente'}${a.petId ? ' - ' + (petById[a.petId] || '') : ''}\n${a.serviceId ? (serviceById[a.serviceId] || '') : ''}`,
    start: a.startsAt,
    end: a.endsAt,
    backgroundColor: statusColors[a.status],
    borderColor: statusColors[a.status],
    extendedProps: {
      ...a,
      customerName: customerById[a.customerId],
      petName: a.petId ? petById[a.petId] : undefined,
      locationName: locationById[a.locationId],
      serviceName: a.serviceId ? (serviceById[a.serviceId] || '') : undefined,
    },
  }));

  // Handlers de interação (criação, mover, redimensionar)
  const calendarRef = useRef(null);

  const handleDateSelect = (selectInfo: any) => {
    // Redireciona para página de novo agendamento já com data/hora
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;
    window.location.href = `/admin/appointments/new?startsAt=${encodeURIComponent(start)}&endsAt=${encodeURIComponent(end)}`;
  };

  const handleEventClick = (clickInfo: any) => {
    // Redireciona para edição
    window.location.href = `/admin/appointments/${clickInfo.event.id}`;
  };

  // TODO: Implementar handlers de mover/redimensionar (drag-n-drop) integrando com API

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="mt-2 text-gray-600">
            Visualize, crie e gerencie agendamentos de clientes, pets e serviços.
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
        <div className="text-center text-gray-600">Carregando agenda...</div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardHeader title="Nenhum agendamento" />
          <p className="text-gray-600">Crie seu primeiro agendamento.</p>
        </Card>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locales={[ptBrLocale]}
            locale="pt-br"
            selectable
            editable
            selectMirror
            select={handleDateSelect}
            eventClick={handleEventClick}
            events={events}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            nowIndicator
            eventDisplay="block"
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            dayMaxEvents={3}
            aspectRatio={1.5}
          />
        </div>
      )}
    </div>
  );
}
