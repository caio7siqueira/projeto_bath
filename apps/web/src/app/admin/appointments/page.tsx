"use client";
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
  DONE: '#22c55e',
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
  const { services, isLoading: servicesLoading, error: servicesError, fetchServices } = useServices();
  const [mounted, setMounted] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchAppointments();
    fetchCustomers();
    fetchLocations();
    fetchServices();
  }, []);

  useEffect(() => {
    if (appointments.length === 0) return;
    const customerIds = Array.from(new Set(appointments.map((a) => a.customerId).filter(Boolean)));
    customerIds.forEach((customerId) => {
      fetchPets(customerId, { append: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

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

  if (!mounted) {
    // Skeleton inicial
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 bg-gray-200 rounded" />
          <div className="h-6 w-1/2 bg-gray-100 rounded" />
          <div className="h-96 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  // Mapeia agendamentos para eventos do FullCalendar
  const events = appointments.map((a) => ({
    id: a.id,
    title: `${customerById[a.customerId] || 'Cliente'}${a.petId ? ' - ' + (petById[a.petId] || '') : ''}${a.serviceId ? '\n' + (serviceById[a.serviceId] || '') : ''}`,
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
      status: a.status,
      isRecurrence: !!a.recurrenceSeriesId,
    },
  }));

  // Adiciona legenda de recorrência e ações rápidas
  const renderEventContent = (eventInfo: any) => {
    const { isRecurrence } = eventInfo.event.extendedProps;
    return (
      <div className="flex flex-col">
        <span>{eventInfo.event.title}</span>
        {isRecurrence && (
          <span className="text-xs text-purple-600 font-semibold mt-1">Recorrente</span>
        )}
      </div>
    );
  };

  // Handlers de interação (criação, mover, redimensionar)
  const calendarRef = useRef(null);

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;
    window.location.href = `/admin/appointments/new?startsAt=${encodeURIComponent(start)}&endsAt=${encodeURIComponent(end)}`;
  };

  const handleEventClick = (clickInfo: any) => {
    window.location.href = `/admin/appointments/${clickInfo.event.id}`;
  };

  // Drag & drop (desktop): atualiza agendamento ao mover/redimensionar
  const { updateExistingAppointment } = useAppointments();
  const handleEventDrop = async (dropInfo: any) => {
    const id = dropInfo.event.id;
    const startsAt = dropInfo.event.startStr;
    const endsAt = dropInfo.event.endStr;
    try {
      await updateExistingAppointment(id, { startsAt, endsAt });
    } catch (err) {
      alert('Erro ao mover agendamento: ' + (err instanceof Error ? err.message : ''));
      dropInfo.revert();
    }
  };
  const handleEventResize = handleEventDrop;

  // Mobile: lista vertical por horário, swipe entre dias, FAB
  const [mobileDay, setMobileDay] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const mobileAppointments = useMemo(() => {
    const dayStr = mobileDay.toISOString().slice(0, 10);
    return appointments.filter(a => a.startsAt.slice(0, 10) === dayStr)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [appointments, mobileDay]);

  const handlePrevDay = () => setMobileDay(new Date(mobileDay.getTime() - 86400000));
  const handleNextDay = () => setMobileDay(new Date(mobileDay.getTime() + 86400000));

  // Tap & hold para criar agendamento rápido no mobile
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const [tapStart, setTapStart] = useState<Date | null>(null);
  const handleMobileSlotTouchStart = (hour: number) => {
    setTapStart(new Date());
    tapTimeout.current = setTimeout(() => {
      const date = new Date(mobileDay);
      date.setHours(hour, 0, 0, 0);
      const startsAt = date.toISOString();
      const endsAt = new Date(date.getTime() + 60 * 60 * 1000).toISOString();
      window.location.href = `/admin/appointments/new?startsAt=${encodeURIComponent(startsAt)}&endsAt=${encodeURIComponent(endsAt)}`;
    }, 600); // 600ms para tap & hold
  };
  const handleMobileSlotTouchEnd = () => {
    if (tapTimeout.current) clearTimeout(tapTimeout.current);
    setTapStart(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="mt-2 text-gray-600">
            Visualize, crie e gerencie agendamentos de clientes, pets e serviços.
          </p>
        </div>
        <Link href="/admin/appointments/new" className="hidden md:inline-block">
          <Button>Novo Agendamento</Button>
        </Link>
      </div>

      {servicesLoading && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800">
          Carregando serviços disponíveis...
        </div>
      )}
      {servicesError && (
        <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-yellow-800">
          Não foi possível carregar serviços agora. Você ainda pode visualizar a agenda.
        </div>
      )}
      {!servicesLoading && services.length === 0 && !servicesError && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800 flex items-center justify-between">
          Nenhum serviço cadastrado ainda.
          <Link href="/admin/services/new">
            <Button size="sm" variant="secondary" className="ml-2">Cadastrar serviço</Button>
          </Link>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse h-8 w-1/3 bg-gray-200 rounded mx-auto" />
          <div className="animate-pulse h-6 w-1/2 bg-gray-100 rounded mx-auto" />
          <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardHeader title="Nenhum agendamento" />
          <p className="text-gray-600">Crie seu primeiro agendamento.</p>
        </Card>
      ) : (
        <>
          {/* Mobile: lista vertical, swipe, FAB */}
          {isMobile ? (
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Button onClick={handlePrevDay} size="sm" aria-label="Dia anterior">◀</Button>
                <span className="font-semibold text-lg">{mobileDay.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
                <Button onClick={handleNextDay} size="sm" aria-label="Próximo dia">▶</Button>
              </div>
              <div className="space-y-3">
                {/* Slots horários para tap & hold */}
                {[...Array(14)].map((_, i) => {
                  const hour = 7 + i;
                  const slotAppointments = mobileAppointments.filter(a => new Date(a.startsAt).getHours() === hour);
                  return (
                    <div key={hour} className="relative group" onTouchStart={() => handleMobileSlotTouchStart(hour)} onTouchEnd={handleMobileSlotTouchEnd}>
                      <div className="text-xs text-gray-400 mb-1">{hour.toString().padStart(2, '0')}:00</div>
                      {slotAppointments.length === 0 ? (
                        <div className="h-12 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs select-none group-hover:bg-blue-50 transition-colors">
                          Tap & hold para agendar
                        </div>
                      ) : (
                        slotAppointments.map(a => (
                          <Card key={a.id} className="flex flex-col p-3 border-l-4 group cursor-pointer transition-shadow hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-400" style={{ borderColor: statusColors[a.status] }} tabIndex={0} aria-label={`Agendamento de ${customerById[a.customerId] || 'Cliente'}`}
                            onClick={() => window.location.href = `/admin/appointments/${a.id}` }>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-base flex items-center gap-2">
                                  <span>{customerById[a.customerId] || 'Cliente'}</span>
                                  {a.petId && <span className="text-xs text-gray-500">• {petById[a.petId]}</span>}
                                </div>
                                {a.serviceId && <div className="text-xs text-blue-600 font-medium">{serviceById[a.serviceId]}</div>}
                              </div>
                              <div className="text-xs px-2 py-1 rounded bg-gray-100 font-bold uppercase tracking-wide" style={{ color: statusColors[a.status] }}>{a.status}</div>
                            </div>
                            <div className="text-sm mt-1 text-gray-700">{new Date(a.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(a.endsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-xs text-gray-400 mt-1">{locationById[a.locationId]}</div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-600 mt-2">Clique para editar</div>
                          </Card>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
              {/* FAB flutuante */}
              <Button className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg md:hidden focus:ring-2 focus:ring-blue-400" onClick={() => window.location.href = `/admin/appointments/new?startsAt=${encodeURIComponent(mobileDay.toISOString().slice(0,10)+'T09:00:00')}`}
                aria-label="Novo agendamento">+ Agendar</Button>
            </div>
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
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                  events={events}
                  height="auto"
                  slotMinTime="07:00:00"
                  slotMaxTime="21:00:00"
                  nowIndicator
                  eventDisplay="block"
                  eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                  dayMaxEvents={3}
                  aspectRatio={1.5}
                  eventClassNames={(arg) => `transition-shadow focus:ring-2 focus:ring-blue-400 ${arg.event.extendedProps.status ? 'border-l-4' : ''}`}
                  eventContent={renderEventContent}
                />
            </div>
          )}
        </>
      )}
    </div>
  );
}
