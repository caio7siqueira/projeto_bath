"use client";

import { useEffect, useMemo, useState, useRef } from 'react';

// Hook simples para detectar mobile
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, HeroSkeleton, SkeletonBlock } from '@/components/feedback/VisualStates';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAppointments, useCustomers, usePets, useLocations, useServices } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import type { Appointment } from '@/lib/api/appointments';
import type { Customer, Pet } from '@/lib/api/customers';
import type { Location } from '@/lib/api/locations';
import type { Service } from '@/lib/api/services';
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

const statusTokens: Record<Appointment['status'], { label: string; badgeClass: string }> = {
  SCHEDULED: { label: 'Agendado', badgeClass: 'bg-blue-50 text-blue-700' },
  DONE: { label: 'Concluído', badgeClass: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelado', badgeClass: 'bg-rose-50 text-rose-700' },
};


export default function AppointmentsPage() {
  // Garante que mounted seja true após o primeiro render
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    fetchAppointments();
    fetchServices();
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // HOOKS DE DADOS - sempre no topo
  const {
    appointments,
    isLoading,
    error,
    fetchAppointments,
    cancelExistingAppointment,
    updateExistingAppointment,
  } = useAppointments();
  const { updateAppointmentInStore } = useAppStore();
  const { customers, fetchCustomers } = useCustomers();
  const { pets, fetchPets } = usePets();
  const { locations, fetchLocations } = useLocations();
  const { services, isLoading: servicesLoading, error: servicesError, fetchServices } = useServices();
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [mobileDay, setMobileDay] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const [tapStart, setTapStart] = useState<Date | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);
  const isMobile = useIsMobile();
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

  // Eventos reais alimentados pela store
  const events = useMemo(
    () =>
      appointments.map((appointment) => ({
        id: appointment.id,
        title: 'Agendamento',
        start: appointment.startsAt,
        end: appointment.endsAt,
        backgroundColor: statusColors[appointment.status],
        borderColor: statusColors[appointment.status],
        extendedProps: appointment,
      })),
    [appointments],
  );
  const renderEventContent = () => null;
  const handleDateSelect = () => {};
  const handleEventClick = () => {};
  const handleEventDrop = () => {};
  const handleEventResize = () => {};

  if (!mounted) {
    return (
      <div className="page-shell space-y-6">
        <HeroSkeleton />
        <SkeletonBlock className="h-96 w-full" />
      </div>
    );
  }

  const showEmptyAppointments = !isLoading && appointments.length === 0;
  const hasAppointments = !isLoading && sortedAppointments.length > 0;

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

      {!isLoading && hasAppointments && (
        <section aria-label="Lista de agendamentos" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedAppointments.map((appointment) => {
            const customer = appointment.customerId ? customersById.get(appointment.customerId) : undefined;
            const pet = appointment.petId ? petsById.get(appointment.petId) : undefined;
            const service = appointment.serviceId ? servicesById.get(appointment.serviceId) : undefined;
            const location = appointment.locationId ? locationsById.get(appointment.locationId) : undefined;

            const startDate = appointment.startsAt ? new Date(appointment.startsAt) : null;
            const endDate = appointment.endsAt ? new Date(appointment.endsAt) : null;
            const dateLabel = startDate ? dateFormatter.format(startDate) : 'Data não definida';
            const startTimeLabel = startDate ? timeFormatter.format(startDate) : '--:--';
            const endTimeLabel = endDate ? timeFormatter.format(endDate) : '--:--';
            const notes = appointment.notes?.trim() || 'Sem observações';
            const statusMeta = statusTokens[appointment.status];
            return (
              <article
                key={appointment.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-brand-300"
                aria-label={`Agendamento ${service?.name ?? ''} em ${dateLabel}`}
              >
                <div className="flex items-start justify-between gap-4 text-sm text-slate-500">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-brand-500">{dateLabel}</p>
                    <p className="mt-1 font-semibold text-slate-700">{startTimeLabel} – {endTimeLabel}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}>
                    {statusMeta.label}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Serviço</p>
                  <h3 className="text-lg font-semibold text-slate-900">{service?.name ?? 'Serviço não informado'}</h3>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dl className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tutor</dt>
                      <dd className="font-medium text-slate-900">{customer?.name ?? 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pet</dt>
                      <dd className="font-medium text-slate-900">{pet?.name ?? 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Serviço</dt>
                      <dd className="font-medium text-slate-900">{service?.name ?? 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Horário</dt>
                      <dd className="font-medium text-slate-900">{startTimeLabel} – {endTimeLabel}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-800">Local: </span>
                      {location?.name ?? 'Não informado'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">Notas: </span>
                      {notes}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonBlock className="h-10 w-72" />
          <SkeletonBlock className="h-5 w-1/2" />
          <SkeletonBlock className="h-96 w-full" />
        </div>
      ) : (
        <>
          {isMobile ? (
            showEmptyAppointments ? (
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
            ) : null
          ) : showEmptyAppointments ? (
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
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-surface-divider bg-surface-muted p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => calendarRef.current?.getApi().prev()}>
                    &lt;
                  </Button>
                  <Button size="sm" onClick={() => calendarRef.current?.getApi().today()}>
                    Hoje
                  </Button>
                  <Button size="sm" onClick={() => calendarRef.current?.getApi().next()}>
                    &gt;
                  </Button>
                  <select
                    className="ml-2 rounded border px-2 py-1 text-sm"
                    defaultValue="timeGridWeek"
                    onChange={(e) => calendarRef.current?.getApi().changeView(e.target.value)}
                  >
                    <option value="dayGridMonth">Mês</option>
                    <option value="timeGridWeek">Semana</option>
                    <option value="timeGridDay">Dia</option>
                  </select>
                </div>
                <Link href="/admin/appointments/new">
                  <Button size="sm" icon={<span aria-hidden>＋</span>}>
                    Novo agendamento
                  </Button>
                </Link>
              </div>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={false}
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
                eventClassNames={(arg) =>
                  `transition-shadow focus:ring-2 focus:ring-blue-400 ${arg.event.extendedProps.status ? 'border-l-4' : ''}`
                }
                eventContent={renderEventContent}
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                dayHeaderFormat={{ weekday: 'short', day: '2-digit', month: '2-digit' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
