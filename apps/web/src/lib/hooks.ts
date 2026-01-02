import { useCallback, useState } from 'react';
import { normalizeApiError } from './api/errors';
import { listServices, createService, type Service, type CreateServiceDto } from './api/services';
export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const data = await listServices();
      setServices(data);
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não conseguimos carregar os serviços.');
      if (parsed.status === 404) {
        setServices([]);
      }
      setErrorState(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewService = useCallback(async (dto: CreateServiceDto) => {
    try {
      const service = await createService(dto);
      setServices((prev) => [service, ...prev]);
      return service;
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível criar o serviço.');
      setErrorState(parsed.message);
      throw parsed;
    }
  }, []);

  return {
    services,
    isLoading,
    error,
    fetchServices,
    createNewService,
  };
}
import { useAppStore } from './store';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listPets,
  createPet,
  listAllPets,
  type Customer,
  type CreateCustomerDto,
  type UpdateCustomerDto,
  type Pet,
  type CreatePetDto,
  type UpdatePetDto,
  type ListAllPetsResult,
} from './api/customers';
import {
  listAppointments,
  fetchAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  type Appointment,
  type CreateAppointmentDto,
  type UpdateAppointmentDto,
  type ListAppointmentsQuery,
} from './api/appointments';
import {
  listLocations,
  createLocation,
  type Location,
  type CreateLocationDto,
} from './api/locations';

export function useCustomers() {
  const {
    customers,
    setCustomers,
    addCustomer,
    updateCustomerInStore,
    removeCustomer,
    setLoading,
    setError,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const result = await listCustomers();
      setCustomers(result.data);
      return result;
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não conseguimos carregar os clientes.');
      setErrorState(parsed.message);
      setError(parsed.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCustomers, setError]);

  const createNewCustomer = useCallback(async (dto: CreateCustomerDto) => {
    try {
      const customer = await createCustomer(dto);
      addCustomer(customer);
      return customer;
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível criar o cliente.');
      setErrorState(parsed.message);
      setError(parsed.message);
      throw parsed;
    }
  }, [addCustomer, setError]);

  const updateExistingCustomer = useCallback(
    async (id: string, dto: UpdateCustomerDto) => {
      try {
        const customer = await updateCustomer(id, dto);
        updateCustomerInStore(id, customer);
        return customer;
      } catch (err) {
        const parsed = normalizeApiError(err, 'Não foi possível atualizar o cliente.');
        setErrorState(parsed.message);
        setError(parsed.message);
        throw parsed;
      }
    },
    [setError, updateCustomerInStore],
  );

  const deleteExistingCustomer = useCallback(
    async (id: string) => {
      try {
        await deleteCustomer(id);
        removeCustomer(id);
      } catch (err) {
        const parsed = normalizeApiError(err, 'Não foi possível remover o cliente.');
        setErrorState(parsed.message);
        setError(parsed.message);
        throw parsed;
      }
    },
    [removeCustomer, setError],
  );

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    createNewCustomer,
    updateExistingCustomer,
    deleteExistingCustomer,
  };
}

export function useAppointments() {
  const {
    appointments,
    setAppointments,
    addAppointment,
    updateAppointmentInStore,
    removeAppointment,
    setError,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const fetchAppointments = async (filters?: ListAppointmentsQuery) => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const data = await listAppointments(filters);
      setAppointments(data);
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não conseguimos carregar os agendamentos.');
      setErrorState(parsed.message);
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointmentById = async (id: string) => {
    setErrorState(null);
    try {
      const existing = appointments.find((a) => a.id === id);
      if (existing) return existing;
      const appointment = await fetchAppointment(id);
      updateAppointmentInStore(id, appointment);
      return appointment;
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não conseguimos carregar o agendamento.');
      setErrorState(parsed.message);
      setError(parsed.message);
      throw parsed;
    }
  };

  const createNewAppointment = async (dto: CreateAppointmentDto) => {
    console.log('[useAppointments] createNewAppointment chamado!');
    console.log('[useAppointments] Enviando para backend:', dto);
    try {
      const appointment = await createAppointment(dto);
      console.log('[useAppointments] Resposta backend:', appointment);
      addAppointment(appointment);
      return appointment;
    } catch (err) {
      console.error('[useAppointments] Erro ao criar:', err);
      const parsed = normalizeApiError(err, 'Não foi possível criar o agendamento.');
      setErrorState(parsed.message);
      setError(parsed.message);
      throw parsed;
    }
  };

  const updateExistingAppointment = async (
    id: string,
    dto: UpdateAppointmentDto
  ) => {
    try {
      const appointment = await updateAppointment(id, dto);
      updateAppointmentInStore(id, appointment);
      return appointment;
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível atualizar o agendamento.');
      setErrorState(parsed.message);
      setError(parsed.message);
      throw parsed;
    }
  };

  const cancelExistingAppointment = async (id: string) => {
    try {
      const appointment = await cancelAppointment(id);
      updateAppointmentInStore(id, appointment);
      return appointment;
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível cancelar o agendamento.');
      setErrorState(parsed.message);
      setError(parsed.message);
      throw parsed;
    }
  };

  const deleteAppointmentLocally = (id: string) => {
    removeAppointment(id);
  };

  return {
    appointments,
    isLoading,
    error,
    fetchAppointments,
    fetchAppointmentById,
    createNewAppointment,
    updateExistingAppointment,
    cancelExistingAppointment,
    deleteAppointmentLocally,
  };
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const fetchLocations = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const data = await listLocations();
      setLocations(data);
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível carregar os locais.');
      setErrorState(parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewLocation = async (dto: CreateLocationDto) => {
    try {
      const location = await createLocation(dto);
      setLocations((prev) => [...prev, location]);
      return location;
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível criar o local.');
      setErrorState(parsed.message);
      throw parsed;
    }
  };

  return {
    locations,
    isLoading,
    error,
    fetchLocations,
    createNewLocation,
  };
}

import { useAuth } from './auth-context';

export function usePets() {
  const { pets, setPets, addPet, setError } = useAppStore();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number }>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

  const mergePetsList = useCallback((incoming: Pet[], append?: boolean) => {
    setPets((prev) => {
      if (!append) {
        return incoming;
      }
      const deduped = new Map<string, Pet>();
      prev.forEach((pet) => deduped.set(pet.id, pet));
      incoming.forEach((pet) => deduped.set(pet.id, pet));
      return Array.from(deduped.values());
    });
  }, [setPets]);

  // Busca global (ADMIN/SUPER_ADMIN)
  const fetchAllPets = useCallback(async (opts?: { page?: number; pageSize?: number; q?: string }) => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const result: ListAllPetsResult = await listAllPets(opts);
      mergePetsList(result.items, false);
      setPagination({ page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages });
      return result.items;
    } catch (err) {
      mergePetsList([], false);
      const parsed = normalizeApiError(err, 'Não foi possível carregar os pets.');
      setErrorState(parsed.message);
      setError(parsed.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [mergePetsList, setError]);

  // Busca por cliente (STAFF)
  const fetchPets = useCallback(async (customerId: string, opts?: { append?: boolean }) => {
    if (!customerId) {
      setErrorState('Selecione um cliente para listar os pets.');
      return [];
    }
    setIsLoading(true);
    setErrorState(null);
    try {
      const data = await listPets(customerId);
      mergePetsList(data, opts?.append);
      return data;
    } catch (err) {
      mergePetsList([], false);
      const parsed = normalizeApiError(err, 'Não foi possível carregar os pets.');
      setErrorState(parsed.message);
      setError(parsed.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [mergePetsList, setError]);

  const createNewPet = useCallback(async (customerId: string, dto: CreatePetDto) => {
    try {
      const pet = await createPet(customerId, dto);
      addPet(pet);
      return pet;
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível criar o pet.');
      setErrorState(parsed.message);
      setError(parsed.message);
      throw parsed;
    }
  }, [addPet, setError]);

  return {
    pets,
    isLoading,
    error,
    fetchAllPets,
    fetchPets,
    createNewPet,
    pagination,
    user,
  };
}
