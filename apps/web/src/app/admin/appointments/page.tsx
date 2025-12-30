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
  // Garante que mounted seja true após o primeiro render
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
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

  // Funções e memos necessários para o FullCalendar (stubs temporários para evitar ReferenceError)
  const events = useMemo(() => [], []);
  const renderEventContent = () => null;
  const handleDateSelect = () => {};
  const handleEventClick = () => {};
  const handleEventDrop = () => {};
  const handleEventResize = () => {};

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

  // ÚNICO return principal do componente
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
        // Nenhum serviço disponível, mas não exibe nada
        null
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
      ) : (
        <>
          {/* Mobile: lista vertical, swipe, FAB */}
          {isMobile ? (
            <div className="relative">
              {/* ...existing mobile code... */}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
              {/* Barra de visualização e botão novo agendamento */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border-b bg-gray-50">
                <div className="flex gap-2 items-center">
                  <Button size="sm" onClick={() => calendarRef.current?.getApi().prev()}>&lt;</Button>
                  <Button size="sm" onClick={() => calendarRef.current?.getApi().today()}>Hoje</Button>
                  <Button size="sm" onClick={() => calendarRef.current?.getApi().next()}>&gt;</Button>
                  <select
                    className="ml-2 border rounded px-2 py-1 text-sm"
                    defaultValue="timeGridWeek"
                    onChange={e => calendarRef.current?.getApi().changeView(e.target.value)}
                  >
                    <option value="dayGridMonth">Mês</option>
                    <option value="timeGridWeek">Semana</option>
                    <option value="timeGridDay">Dia</option>
                  </select>
                </div>
                <Link href="/admin/appointments/new">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">+ Novo Agendamento</Button>
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
                eventClassNames={(arg) => `transition-shadow focus:ring-2 focus:ring-blue-400 ${arg.event.extendedProps.status ? 'border-l-4' : ''}`}
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
