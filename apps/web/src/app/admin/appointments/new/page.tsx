"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { useCustomers, usePets, useLocations, useServices, useAppointments } from '@/lib/hooks';
import { appointmentSchema, AppointmentFormData } from '@/lib/schemas';

export default function NewAppointmentPage() {
  // =============================
  // Hooks e variáveis SEMPRE antes do return!
  // =============================
  const { customers, isLoading: customersLoading, fetchCustomers, error: customersError } = useCustomers();
  const { pets, isLoading: petsLoading, fetchPets, error: petsError } = usePets();
  const { locations, isLoading: locationsLoading, fetchLocations, error: locationsError } = useLocations();
  const { services, isLoading: servicesLoading, fetchServices, error: servicesError } = useServices();
  const { createNewAppointment } = useAppointments();

  // Debug: Verifique se os arrays estão populados corretamente
  // Corrige loop infinito: executa fetch apenas uma vez ao montar
  useEffect(() => {
    fetchCustomers();
    fetchServices();
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forçar refetch dos dados ao montar e ao cadastrar/editar entidades
  // (sincronização global)
  // Pode ser expandido com eventos customizados se necessário

  // Buscar pets do cliente selecionado
  // (watch só pode ser usado após o useForm)
  // useForm e hooks relacionados devem vir ANTES de qualquer uso de watch
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

  const selectedCustomerId = watch('customerId');
  useEffect(() => {
    if (selectedCustomerId) {
      fetchPets(selectedCustomerId);
      setValue('petId', ''); // Limpa o pet selecionado ao trocar de cliente
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);
  console.log('SERVICES:', services);
  console.log('LOCATIONS:', locations);
  console.log('CUSTOMERS:', customers);
  console.log('PETS:', pets);
  const recurrence = watch('recurrence');
  const recurrenceRule = watch('recurrenceRule');
  const selectedServiceId = watch('serviceId');
  const startsAt = watch('startsAt');

  // Preenche automaticamente o campo de término ao selecionar serviço
  useEffect(() => {
    if (selectedServiceId && startsAt) {
      const selectedService = services?.find((s: any) => s.id === selectedServiceId);
      if (selectedService && selectedService.baseDurationMinutes) {
        const startDate = new Date(startsAt);
        if (!isNaN(startDate.getTime())) {
          const endDate = new Date(startDate.getTime() + selectedService.baseDurationMinutes * 60000);
          setValue('endsAt', endDate.toISOString().slice(0, 16)); // formato yyyy-MM-ddTHH:mm
        }
      }
    }
  }, [selectedServiceId, startsAt, services, setValue]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateError, setDateError] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [petSearch, setPetSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const requiredTooltip = 'Campo obrigatório';
  // Filtros de busca (garanta que os arrays são sempre arrays)
  const filteredCustomers = (customers || []).filter((c: any) => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  // Só mostrar pets do cliente selecionado
  const filteredPets = (pets || []).filter((p: any) => p.name.toLowerCase().includes(petSearch.toLowerCase()));
  const filteredServices = (services || []).filter((s: any) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
  const watched = watch();

  const onSubmit = async (data: any) => {
    setError('');
    setSuccess('');
    setDateError('');
    console.log('[Novo Agendamento] onSubmit chamado!');
    console.log('[Novo Agendamento] Dados enviados:', data);
    // Validação dos campos obrigatórios
    if (!data.customerId) {
      setError('Selecione um cliente.');
      return;
    }
    if (!data.petId) {
      setError('Selecione um pet.');
      return;
    }
    if (!data.serviceId) {
      setError('Selecione um serviço.');
      return;
    }
    if (!data.locationId) {
      setError('Selecione um local.');
      return;
    }
    if (!data.startsAt || !data.endsAt) {
      setDateError('Preencha início e fim do agendamento.');
      return;
    }
    if (new Date(data.endsAt) <= new Date(data.startsAt)) {
      setDateError('A data/hora de término deve ser posterior ao início.');
      return;
    }
    // Criação direta do agendamento
    try {
      setSuccess('');
      setError('');
      let result;
      if (data.recurrence) {
        console.log('[Novo Agendamento] Enviando série recorrente...');
        result = await fetch('/v1/recurrence-series', {
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
        console.log('[Novo Agendamento] Resposta recorrente:', result);
      } else {
        console.log('[Novo Agendamento] Enviando agendamento único...');
        console.log('[Novo Agendamento] Chamando createNewAppointment...');
        result = await createNewAppointment(data);
        console.log('[Novo Agendamento] Resposta agendamento:', result);
        if (!result || !result.id) {
          setError('O backend não retornou o ID do agendamento. Verifique a API.');
          return;
        }
      }
      setSuccess('Agendamento criado com sucesso! Redirecionando...');
      setTimeout(() => {
        window.location.href = '/admin/appointments';
      }, 1200);
    } catch (err: any) {
      console.error('[Novo Agendamento] Erro ao criar:', err);
      setError(err.message ? `Erro ao criar agendamento: ${err.message}` : JSON.stringify(err));
    }
  };

  const handleConfirm = async (data: any) => {
    setError('');
    setSuccess('');
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
      setSuccess('Agendamento criado com sucesso! Redirecionando...');
      setTimeout(() => {
        window.location.href = '/admin/appointments';
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar agendamento');
    }
  };

  return (
    <>
      {/* Resumo antes de salvar */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Confirme os dados do agendamento</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li><b>Cliente:</b> {customers?.find((c: any) => c.id === watched.customerId)?.name || '-'}</li>
              <li><b>Pet:</b> {pets?.find((p: any) => p.id === watched.petId)?.name || '-'}</li>
              <li><b>Serviço:</b> {services?.find((s: any) => s.id === watched.serviceId)?.name || '-'}</li>
              <li><b>Local:</b> {locations?.find((l: any) => l.id === watched.locationId)?.name || '-'}</li>
              <li><b>Início:</b> {watched.startsAt ? new Date(watched.startsAt).toLocaleString() : '-'}</li>
              <li><b>Fim:</b> {watched.endsAt ? new Date(watched.endsAt).toLocaleString() : '-'}</li>
              <li><b>Observações:</b> {watched.notes || '-'}</li>
              {watched.recurrence && <li><b>Recorrente:</b> {watched.recurrenceRule} {watched.recurrenceRule === 'CUSTOM_INTERVAL' ? `(${watched.recurrenceInterval} dias)` : ''} até {watched.recurrenceEndDate || '-'}</li>}
            </ul>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="secondary" onClick={() => setShowSummary(false)}>Editar</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleConfirm(watched)}>Confirmar e Salvar</Button>
            </div>
          </div>
        </div>
      )}
      <form className="max-w-2xl mx-auto p-6 md:p-10 bg-white rounded-lg shadow space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-2xl font-bold mb-4">Novo Agendamento</h2>
        {/* Agrupamento de campos: Cliente/Pet, Serviço/Local, Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bloco Cliente/Pet */}
          <div className="space-y-4">
            <label className="block font-medium" title={requiredTooltip}>Cliente <span className="text-red-500" title={requiredTooltip}>*</span></label>
            <input type="text" placeholder="Buscar cliente..." className="w-full border rounded p-2 mb-1" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
            {/*
              Select de Cliente: Populado dinamicamente. Se não houver clientes, mostra mensagem amigável.
              Dica manutenção: Se este select estiver sempre vazio, verifique o hook useCustomers e a API/backend.
            */}
            <select {...register('customerId')} className="w-full border rounded p-2" disabled={customersLoading || !customers?.length}>
              <option value="">Selecione</option>
              {customersLoading ? (
                <option disabled>Carregando...</option>
              ) : customers && customers.length > 0 ? (
                filteredCustomers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              ) : (
                <option disabled>Nenhum cliente cadastrado</option>
              )}
            </select>
            {errors.customerId && <span className="text-red-600 text-sm">{errors.customerId.message}</span>}

            <label className="block font-medium" title={requiredTooltip}>Pet <span className="text-red-500" title={requiredTooltip}>*</span></label>
            <input type="text" placeholder="Buscar pet..." className="w-full border rounded p-2 mb-1" value={petSearch} onChange={e => setPetSearch(e.target.value)} />
            {/*
              Select de Pet: Populado dinamicamente. Se não houver pets, mostra mensagem amigável.
              Dica manutenção: Se este select estiver sempre vazio, verifique o hook usePets e a API/backend.
            */}
            <select {...register('petId')} className="w-full border rounded p-2" disabled={petsLoading || !selectedCustomerId || !pets?.length}>
              <option value="">Selecione</option>
              {petsLoading ? (
                <option disabled>Carregando...</option>
              ) : pets && pets.length > 0 ? (
                filteredPets.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              ) : (
                <option disabled>Nenhum pet cadastrado</option>
              )}
            </select>
            {errors.petId && <span className="text-red-600 text-sm">{errors.petId.message}</span>}
          </div>

          {/* Bloco Serviço/Local */}
          <div className="space-y-4">
            <label className="block font-medium" title={requiredTooltip}>Serviço <span className="text-red-500" title={requiredTooltip}>*</span></label>
            <input type="text" placeholder="Buscar serviço..." className="w-full border rounded p-2 mb-1" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} />
            {/*
              Select de Serviço: Populado dinamicamente. Se não houver serviços, mostra mensagem amigável.
              Dica manutenção: Se este select estiver sempre vazio, verifique o hook useServices e a API/backend.
            */}
            <select {...register('serviceId')} className="w-full border rounded p-2" disabled={servicesLoading || !services?.length}>
              <option value="">Selecione</option>
              {servicesLoading ? (
                <option disabled>Carregando...</option>
              ) : services && services.length > 0 ? (
                filteredServices.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))
              ) : (
                <option disabled>Nenhum serviço cadastrado</option>
              )}
            </select>
            {errors.serviceId && <span className="text-red-600 text-sm">{errors.serviceId.message}</span>}

            <label className="block font-medium" title={requiredTooltip}>Local <span className="text-red-500" title={requiredTooltip}>*</span></label>
            {/*
              Select de Local: Populado dinamicamente. Se não houver locais, mostra mensagem amigável.
              Dica manutenção: Se este select estiver sempre vazio, verifique o hook useLocations e a API/backend.
            */}
            <select {...register('locationId')} className="w-full border rounded p-2" disabled={locationsLoading || !locations?.length}>
              <option value="">Selecione</option>
              {locationsLoading ? (
                <option disabled>Carregando...</option>
              ) : locations && locations.length > 0 ? (
                locations.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))
              ) : (
                <option disabled>Nenhum local cadastrado</option>
              )}
            </select>
            {errors.locationId && <span className="text-red-600 text-sm">{errors.locationId.message}</span>}
          </div>

          {/* Bloco Datas */}
          <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium" title={requiredTooltip}>Início <span className="text-red-500" title={requiredTooltip}>*</span></label>
              <input type="datetime-local" {...register('startsAt')} className="w-full border rounded p-2" />
              {errors.startsAt && <span className="text-red-600 text-sm">{errors.startsAt.message}</span>}
            </div>
            <div>
              <label className="block font-medium" title={requiredTooltip}>Fim <span className="text-red-500" title={requiredTooltip}>*</span></label>
              <input type="datetime-local" {...register('endsAt')} className="w-full border rounded p-2" />
              {errors.endsAt && <span className="text-red-600 text-sm">{errors.endsAt.message}</span>}
              {dateError && <span className="text-red-600 text-sm">{dateError}</span>}
            </div>
          </div>
        </div>

        {/* Observações e Recorrência */}
        <div className="space-y-4">
          <label className="block font-medium">Observações</label>
          <input type="text" {...register('notes')} className="w-full border rounded p-2" />
          {errors.notes && <span className="text-red-600 text-sm">{errors.notes.message}</span>}

          {/* Recorrência */}
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" {...register('recurrence')} />
            Recorrente
          </label>
          {recurrence && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Mensagens de erro e botão de ação */}
        {error && <div className="text-red-600 text-center">{error}</div>}
        {success && <div className="text-green-600 text-center">{success}</div>}
        {customersError && <div className="text-red-600 text-center">{customersError}</div>}
        {petsError && <div className="text-red-600 text-center">{petsError}</div>}
        {servicesError && <div className="text-red-600 text-center">{servicesError}</div>}
        {locationsError && <div className="text-red-600 text-center">{locationsError}</div>}
        {/*
          UX: O botão de salvar fica destacado, alinhado à direita em telas médias+ e centralizado no mobile.
          O botão é desabilitado se não houver opções obrigatórias disponíveis.
        */}
        <div className="flex flex-col md:flex-row md:justify-end mt-6">
          <Button
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2"
            disabled={
              isSubmitting ||
              !customers?.length ||
              !services?.length ||
              !locations?.length
            }
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </>
  );
}
