"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, HeroSkeleton, SkeletonBlock } from '@/components/feedback/VisualStates';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAppointments, useCustomers, usePets, useLocations, useServices } from '@/lib/hooks';
import type { Appointment } from '@/lib/api/appointments';
import type { Customer, Pet } from '@/lib/api/customers';
import type { Location } from '@/lib/api/locations';
import type { Service } from '@/lib/api/services';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core';

const statusVisuals: Record<Appointment['status'], {
  label: string;
  blockClass: string;
  badgeClass: string;
  accentDot: string;
  mutedDot: string;
}> = {
  SCHEDULED: {
    label: 'Agendado',
    blockClass: 'bg-blue-600 text-white',
    badgeClass: 'bg-blue-50 text-blue-700',
    accentDot: 'bg-blue-400',
    mutedDot: 'bg-blue-200',
  },
  DONE: {
    label: 'Concluído',
    blockClass: 'bg-emerald-600 text-white',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    accentDot: 'bg-emerald-400',
    mutedDot: 'bg-emerald-200',
  },
  CANCELLED: {
    label: 'Cancelado',
    blockClass: 'bg-slate-500 text-white',
    badgeClass: 'bg-slate-200 text-slate-700',
    accentDot: 'bg-slate-400',
    mutedDot: 'bg-slate-300',
  },
};

const clampToDayStart = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, delta: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return clampToDayStart(next);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

type CalendarEventPayload = {
  appointment: Appointment;
  customer?: Customer;
  pet?: Pet;
  service?: Service;
  location?: Location;
};

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

type CalendarEventClassArg = {
  event: { id: string };
};

const formatRangeLabel = (start: Date, end: Date) => {
  const startDay = clampToDayStart(start);
  const endDay = clampToDayStart(addDays(end, -1));
  const monthOptions: Intl.DateTimeFormatOptions = { month: 'short' };
  const startMonth = startDay.toLocaleString('pt-BR', monthOptions);
  const endMonth = endDay.toLocaleString('pt-BR', monthOptions);
  if (startDay.getMonth() === endDay.getMonth() && startDay.getFullYear() === endDay.getFullYear()) {
    return `${startDay.getDate()}–${endDay.getDate()} ${startMonth}`;
  }
  return `${startDay.getDate()} ${startMonth} – ${endDay.getDate()} ${endMonth}`;
};

const timeToScrollValue = (dateInput?: string | Date | null) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}:00`;
};


export default function AppointmentsPage() {
  // Garante que mounted seja true após o primeiro render
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    fetchAppointments();
    fetchServices();
    fetchLocations();
    fetchCustomers();
    fetchAllPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(max-width: 768px)');
    const applyMatch = (matches: boolean) => {
      setIsCompactLayout(matches);
      const desiredView: CalendarViewType = matches ? 'timeGridDay' : 'timeGridWeek';
      const api = calendarRef.current?.getApi();
      const currentView = api?.view.type as CalendarViewType | undefined;
      if (api && currentView && (currentView === 'timeGridWeek' || currentView === 'timeGridDay') && currentView !== desiredView) {
        api.changeView(desiredView);
      }
      setCalendarView((prev) => {
        if (matches && prev === 'timeGridWeek') return 'timeGridDay';
        if (!matches && prev === 'timeGridDay') return 'timeGridWeek';
        return prev;
      });
    };
    applyMatch(query.matches);
    const listener = (event: MediaQueryListEvent) => applyMatch(event.matches);
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', listener);
    } else {
      // Safari < 14
      // @ts-expect-error - addListener ainda é usado em navegadores legados
      query.addListener(listener);
    }
    return () => {
      if (typeof query.removeEventListener === 'function') {
        query.removeEventListener('change', listener);
      } else {
        // @ts-expect-error - removeListener para suporte legado
        query.removeListener(listener);
      }
    };
  }, []);
  // HOOKS DE DADOS - sempre no topo
  const {
    appointments,
    isLoading,
    error,
    fetchAppointments,
  } = useAppointments();
  const { customers, fetchCustomers } = useCustomers();
  const { pets, fetchAllPets } = usePets();
  const { locations, fetchLocations } = useLocations();
  const { services, isLoading: servicesLoading, error: servicesError, fetchServices } = useServices();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarViewType>('timeGridWeek');
  const [currentRangeLabel, setCurrentRangeLabel] = useState('');
  const [focusDay, setFocusDay] = useState(() => clampToDayStart(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventPayload | null>(null);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [appointments],
  );
  const customersById = useMemo(() => {
    const map = new Map<string, Customer>();
    (customers ?? []).forEach((customer) => {
      if (customer?.id) {
        map.set(customer.id, customer as Customer);
      }
    });
    return map;
  }, [customers]);
  const petsById = useMemo(() => {
    const map = new Map<string, Pet>();
    (pets ?? []).forEach((pet) => {
      if (pet?.id) {
        map.set(pet.id, pet as Pet);
      }
    });
    return map;
  }, [pets]);
  const servicesById = useMemo(() => {
    const map = new Map<string, Service>();
    (services ?? []).forEach((service) => {
      if (service?.id) {
        map.set(service.id, service as Service);
      }
    });
    return map;
  }, [services]);
  const locationsById = useMemo(() => {
    const map = new Map<string, Location>();
    (locations ?? []).forEach((location) => {
      if (location?.id) {
        map.set(location.id, location as Location);
      }
    });
    return map;
  }, [locations]);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }),
    [],
  );
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  );
  const focusDayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }),
    [],
  );

  const focusDayLabel = focusDayFormatter.format(focusDay);

  const slotLabelFormat = useMemo(
    () => ({
      hour: isCompactLayout ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    [isCompactLayout],
  );

  const headerFormat = useMemo(
    () => (isCompactLayout ? { weekday: 'short', day: '2-digit' } : { weekday: 'short', day: '2-digit', month: '2-digit' }),
    [isCompactLayout],
  );

  const digestAppointments = useMemo(() => {
    return sortedAppointments
      .filter((appointment) => {
        if (!appointment.startsAt) return false;
        const start = new Date(appointment.startsAt);
        return isSameDay(start, focusDay);
      })
      .map((appointment) => {
        const start = appointment.startsAt ? new Date(appointment.startsAt) : null;
        const end = appointment.endsAt ? new Date(appointment.endsAt) : null;
        return {
          appointment,
          customer: appointment.customerId ? customersById.get(appointment.customerId) : undefined,
          pet: appointment.petId ? petsById.get(appointment.petId) : undefined,
          service: appointment.serviceId ? servicesById.get(appointment.serviceId) : undefined,
          location: appointment.locationId ? locationsById.get(appointment.locationId) : undefined,
          startLabel: start ? timeFormatter.format(start) : '--:--',
          endLabel: end ? timeFormatter.format(end) : '--:--',
        };
      });
  }, [sortedAppointments, focusDay, customersById, petsById, servicesById, locationsById, timeFormatter]);

  const selectedDetail = useMemo(() => {
    if (!selectedEvent) return null;
    const start = selectedEvent.appointment.startsAt ? new Date(selectedEvent.appointment.startsAt) : null;
    const end = selectedEvent.appointment.endsAt ? new Date(selectedEvent.appointment.endsAt) : null;
    return {
      ...selectedEvent,
      start,
      end,
      dateLabel: start ? dateFormatter.format(start) : 'Data não definida',
      startLabel: start ? timeFormatter.format(start) : '--:--',
      endLabel: end ? timeFormatter.format(end) : '--:--',
      notes: selectedEvent.appointment.notes?.trim() || 'Sem observações',
    };
  }, [selectedEvent, dateFormatter, timeFormatter]);

  // Eventos reais alimentados pela store
  const events = useMemo(
    () =>
      appointments.map((appointment) => {
        const payload: CalendarEventPayload = {
          appointment,
          customer: appointment.customerId ? customersById.get(appointment.customerId) : undefined,
          pet: appointment.petId ? petsById.get(appointment.petId) : undefined,
          service: appointment.serviceId ? servicesById.get(appointment.serviceId) : undefined,
          location: appointment.locationId ? locationsById.get(appointment.locationId) : undefined,
        };
        return {
          id: appointment.id,
          title: payload.service?.name ?? 'Agendamento',
          start: appointment.startsAt,
          end: appointment.endsAt,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: '#0f172a',
          extendedProps: payload,
        };
      }),
    [appointments, customersById, petsById, servicesById, locationsById],
  );

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const payload = arg.event.extendedProps as CalendarEventPayload;
    const appointment = payload.appointment;
    const visuals = statusVisuals[appointment.status];
    const serviceName = payload.service?.name ?? 'Serviço não informado';
    const secondary = payload.pet?.name ?? payload.customer?.name ?? 'Cliente não informado';
    const start = appointment.startsAt ? new Date(appointment.startsAt) : null;
    const end = appointment.endsAt ? new Date(appointment.endsAt) : null;
    const timeLabel = start && end ? `${timeFormatter.format(start)} – ${timeFormatter.format(end)}` : arg.timeText;

    return (
      <div
        className={`flex h-full flex-col justify-between rounded-[8px] px-2 py-1.5 text-left text-xs font-medium leading-tight ${visuals.blockClass}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${visuals.accentDot}`} aria-hidden />
          <span className="text-[11px] font-semibold tracking-tight opacity-90">{timeLabel}</span>
        </div>
        <div className="mt-1 flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{serviceName}</span>
          <span className="text-[11px] opacity-90">{secondary}</span>
        </div>
      </div>
    );
  }, [timeFormatter]);

  const focusAppointment = useCallback((payload: CalendarEventPayload, opts?: { openDetails?: boolean }) => {
    setFocusedEventId(payload.appointment.id);
    const api = calendarRef.current?.getApi();
    const scrollValue = timeToScrollValue(payload.appointment.startsAt);
    if (api && scrollValue) {
      api.scrollToTime(scrollValue);
    }
    if (opts?.openDetails) {
      setSelectedEvent(payload);
    }
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    arg.jsEvent.preventDefault();
    const payload = arg.event.extendedProps as CalendarEventPayload;
    focusAppointment(payload, { openDetails: true });
  }, [focusAppointment]);

  const closeDetails = useCallback(() => setSelectedEvent(null), []);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setCurrentRangeLabel(formatRangeLabel(arg.start, arg.end));
    setCalendarView(arg.view.type as CalendarViewType);
    const rangeStart = clampToDayStart(arg.start);
    const rangeEnd = clampToDayStart(addDays(arg.end, -1));
    setFocusDay((prev) => {
      if (prev.getTime() < rangeStart.getTime() || prev.getTime() > rangeEnd.getTime()) {
        return rangeStart;
      }
      return prev;
    });
  }, []);

  const handleViewChange = useCallback((view: CalendarViewType) => {
    setCalendarView(view);
    const api = calendarRef.current?.getApi();
    api?.changeView(view);
  }, []);

  const handleRangeShift = useCallback((direction: 'prev' | 'next' | 'today') => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (direction === 'today') {
      api.today();
      return;
    }
    if (direction === 'prev') {
      api.prev();
    } else {
      api.next();
    }
  }, []);

  const handleFocusDayShift = useCallback((delta: number) => {
    setFocusDay((prev) => addDays(prev, delta));
  }, []);

  const handleEventDrop = useCallback(() => {
    // Placeholder: future drag-and-drop reschedule integration will live here.
  }, []);

  const handleEventResize = useCallback(() => {
    // Placeholder: future drag-resize controls will be wired here.
  }, []);

  const eventClassNames = useCallback((arg: CalendarEventClassArg) => {
    const classes = [
      '!border-0',
      '!bg-transparent',
      '!p-0',
      'cursor-pointer',
      'rounded-lg',
      'transition-all',
      'shadow-sm',
      'hover:shadow-lg',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-brand-200',
      'focus-visible:ring-offset-2',
    ];
    if (focusedEventId && arg.event.id === focusedEventId) {
      classes.push('ring-2', 'ring-offset-2', 'ring-brand-300', 'z-20');
    }
    return classes;
  }, [focusedEventId]);

  useEffect(() => {
    if (!selectedEvent) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetails();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedEvent, closeDetails]);

  if (!mounted) {
    return (
      <div className="page-shell space-y-6">
        <HeroSkeleton />
        <SkeletonBlock className="h-96 w-full" />
      </div>
    );
  }

  const showEmptyAppointments = !isLoading && appointments.length === 0;

  // ÚNICO return principal do componente
  return (
    <div className="page-shell space-y-6">
      <header className="page-header">
        <div className="page-header__meta">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Operação</p>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-base text-slate-500">
            Visualize, crie e gerencie agendamentos de clientes, pets e serviços.
          </p>
        </div>
        <div className="page-header__actions">
          <Link href="/admin/appointments/new" className="inline-flex">
            <Button icon={<span aria-hidden>＋</span>}>Novo Agendamento</Button>
          </Link>
        </div>
      </header>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Agenda', isCurrent: true },
        ]}
        note="Esta seção agora registra o caminho da navegação e evita recarregamentos totais quando você abre ou retorna de um agendamento."
      />

      {servicesLoading && (
        <Card className="border-brand-100 bg-brand-50 text-brand-700">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-5 w-5 rounded-full" />
            Carregando serviços disponíveis...
          </div>
        </Card>
      )}
      {servicesError && (
        <EmptyState
          variant="inline"
          mood="warning"
          icon="🧼"
          title="Serviços não carregaram"
          description="Você ainda pode visualizar a agenda, mas cadastros dependem da lista de serviços."
          action={
            <Link href="/admin/services" className="inline-flex justify-center">
              <Button size="sm" variant="secondary">Recarregar serviços</Button>
            </Link>
          }
        />
      )}
      {!servicesLoading && services.length === 0 && !servicesError && (
        <EmptyState
          variant="inline"
          icon="🛁"
          title="Cadastre seus serviços antes de agendar"
          description="Sem serviços ativos não é possível definir duração e preço dos agendamentos."
          action={
            <Link href="/admin/services" className="inline-flex justify-center">
              <Button size="sm">Cadastrar serviço</Button>
            </Link>
          }
        />
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonBlock className="h-10 w-72" />
          <SkeletonBlock className="h-5 w-1/2" />
          <SkeletonBlock className="h-[480px] w-full" />
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <aside className="order-1 w-full xl:order-2 xl:max-w-sm xl:pl-6">
              <div className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-32">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Resumo diário</p>
                    <p className="text-lg font-semibold text-slate-900">{focusDayLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 rounded-full p-0"
                      aria-label="Dia anterior"
                      onClick={() => handleFocusDayShift(-1)}
                    >
                      {'<'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 rounded-full p-0"
                      aria-label="Próximo dia"
                      onClick={() => handleFocusDayShift(1)}
                    >
                      {'>'}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {digestAppointments.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      Nenhum agendamento para este dia. Escolha outro intervalo ou crie um novo horário.
                    </p>
                  ) : (
                    digestAppointments.map(({ appointment, customer, pet, service, location, startLabel, endLabel }) => {
                      const visuals = statusVisuals[appointment.status];
                      const payload: CalendarEventPayload = { appointment, customer, pet, service, location };
                      const isFocused = focusedEventId === appointment.id;
                      return (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() => focusAppointment(payload, { openDetails: true })}
                          className={`w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
                            isFocused ? 'border-brand-300 bg-brand-50 shadow-sm' : 'border-slate-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md'
                          }`}
                          aria-label={`Ver ${service?.name ?? 'serviço'} de ${pet?.name ?? customer?.name ?? 'cliente'} às ${startLabel}`}
                        >
                          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">
                              {startLabel} – {endLabel}
                            </span>
                            <span className={`h-1.5 w-1.5 rounded-full ${visuals.mutedDot}`} aria-hidden />
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {service?.name ?? 'Serviço não informado'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {pet?.name ?? customer?.name ?? 'Cliente não informado'}
                          </p>
                          {location?.name && <p className="text-xs text-slate-400">{location.name}</p>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>

            <div className="order-2 flex-1 rounded-3xl border border-gray-200 bg-white shadow-sm xl:order-1">
              <div className="flex flex-col gap-4 border-b border-surface-divider bg-surface-muted/60 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="ghost" className="px-3" onClick={() => handleRangeShift('prev')} aria-label="Semana anterior">
                    {'<'}
                  </Button>
                  <Button size="sm" variant="ghost" className="px-3" onClick={() => handleRangeShift('today')}>
                    Hoje
                  </Button>
                  <Button size="sm" variant="ghost" className="px-3" onClick={() => handleRangeShift('next')} aria-label="Próxima semana">
                    {'>'}
                  </Button>
                  <div className="ml-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                    {currentRangeLabel || 'Carregando grade...'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    value={calendarView}
                    onChange={(e) => handleViewChange(e.target.value as CalendarViewType)}
                    aria-label="Mudar visualização da agenda"
                  >
                    <option value="dayGridMonth">Mês</option>
                    <option value="timeGridWeek">Semana</option>
                    <option value="timeGridDay">Dia</option>
                  </select>
                  <Link href="/admin/appointments/new">
                    <Button size="sm" icon={<span aria-hidden>＋</span>}>
                      Novo agendamento
                    </Button>
                  </Link>
                </div>
              </div>
              <div className={`px-2 py-4 md:px-4 ${isCompactLayout ? '-mx-4 sm:mx-0' : ''}`}>
                <div className={isCompactLayout ? 'overflow-x-auto pb-3' : ''}>
                  <div className={isCompactLayout ? 'min-w-[640px]' : ''}>
                    <FullCalendar
                      key={isCompactLayout ? 'calendar-mobile' : 'calendar-desktop'}
                      ref={calendarRef}
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView={isCompactLayout ? 'timeGridDay' : 'timeGridWeek'}
                      headerToolbar={false}
                      locales={[ptBrLocale]}
                      locale="pt-br"
                      nowIndicator
                      editable={false}
                      events={events}
                      datesSet={handleDatesSet}
                      eventClick={handleEventClick}
                      eventDrop={handleEventDrop}
                      eventResize={handleEventResize}
                      eventContent={renderEventContent}
                      eventClassNames={eventClassNames}
                      height="auto"
                      expandRows
                      slotMinTime="07:00:00"
                      slotMaxTime="21:00:00"
                      slotLabelFormat={slotLabelFormat}
                      dayHeaderFormat={headerFormat}
                      dayMaxEvents={false}
                      allDaySlot={false}
                      eventDisplay="block"
                      eventTimeFormat={slotLabelFormat}
                      slotEventOverlap
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {showEmptyAppointments && (
            <EmptyState
              icon="📅"
              variant="inline"
              title="Nenhum agendamento por aqui"
              description="Use o botão acima para criar o primeiro horário e acompanhar tudo pela grade."
              action={
                <Link href="/admin/appointments/new" className="inline-flex justify-center">
                  <Button>Agendar agora</Button>
                </Link>
              }
            />
          )}
        </>
      )}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 px-4 py-6 md:items-center">
          <div className="absolute inset-0" aria-hidden="true" onClick={closeDetails} />
          <div className="relative w-full max-w-2xl rounded-t-3xl bg-white p-6 shadow-2xl md:rounded-3xl">
            <button
              type="button"
              onClick={closeDetails}
              className="absolute right-4 top-4 text-2xl font-bold text-slate-400 transition hover:text-slate-600"
              aria-label="Fechar detalhes do agendamento"
            >
              X
            </button>
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-500">Agendamento</p>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {selectedDetail.service?.name ?? 'Serviço não informado'}
                  </h2>
                  <p className="text-sm text-slate-500">{selectedDetail.dateLabel}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusVisuals[selectedDetail.appointment.status].badgeClass}`}>
                  {statusVisuals[selectedDetail.appointment.status].label}
                </span>
              </div>
              <dl className="grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Horário</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {selectedDetail.startLabel} – {selectedDetail.endLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Local</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {selectedDetail.location?.name ?? 'Não informado'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Tutor</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {selectedDetail.customer?.name ?? 'Não informado'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Pet</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {selectedDetail.pet?.name ?? 'Não informado'}
                  </dd>
                </div>
              </dl>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Observações</p>
                <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{selectedDetail.notes}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/appointments/${selectedDetail.appointment.id}`} className="inline-flex">
                  <Button size="sm">Abrir registro</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={closeDetails}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .fc .fc-scrollgrid,
        .fc .fc-scrollgrid table {
          border-color: #e2e8f0;
        }
        .fc .fc-timegrid-slot {
          height: 48px;
        }
        .fc .fc-timegrid-col-frame {
          padding: 0 12px;
        }
        .fc .fc-timegrid-event,
        .fc .fc-timegrid-event .fc-event-main {
          border-radius: 8px;
        }
        .fc .fc-timegrid-event-harness {
          margin-right: 6px;
        }
        .fc .fc-timegrid-event {
          margin: 2px 0;
        }
        .fc .fc-timegrid-event:hover {
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.15);
        }
        .fc .fc-timegrid-slot-label-cushion {
          font-weight: 600;
          color: #475569;
        }
        @media (max-width: 768px) {
          .fc .fc-timegrid-slot {
            height: 60px;
          }
          .fc .fc-timegrid-slot-label-cushion {
            font-size: 0.85rem;
          }
          .fc .fc-timegrid-axis-frame {
            padding-left: 8px;
          }
          .fc .fc-daygrid-day-number {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}
