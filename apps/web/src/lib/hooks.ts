import { useCallback, useState } from 'react';
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
    } catch (err: any) {
      if (err?.status === 404) {
        setServices([]);
        setErrorState('Nenhum serviço cadastrado ainda.');
      } else {
        const message = err instanceof Error ? err.message : 'Erro ao carregar serviços';
        setErrorState(message);
      }
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
      const message = err instanceof Error ? err.message : 'Erro ao criar serviço';
      setErrorState(message);
      throw err;
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
  type Customer,
  type CreateCustomerDto,
  type UpdateCustomerDto,
  type Pet,
  type CreatePetDto,
  type UpdatePetDto,
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

  const fetchCustomers = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const data = await listCustomers();
      setCustomers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewCustomer = async (dto: CreateCustomerDto) => {
    try {
      const customer = await createCustomer(dto);
      addCustomer(customer);
      return customer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
    }
  };

  const updateExistingCustomer = async (
    id: string,
    dto: UpdateCustomerDto
  ) => {
    try {
      const customer = await updateCustomer(id, dto);
      updateCustomerInStore(id, customer);
      return customer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
    }
  };

  const deleteExistingCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
      removeCustomer(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
    }
  };

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
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
    }
  };

  const createNewAppointment = async (dto: CreateAppointmentDto) => {
    try {
      const appointment = await createAppointment(dto);
      addAppointment(appointment);
      return appointment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
    }
  };

  const cancelExistingAppointment = async (id: string) => {
    try {
      const appointment = await cancelAppointment(id);
      updateAppointmentInStore(id, appointment);
      return appointment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      throw err;
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

export function usePets() {
  const { pets, setPets, addPet, updatePetInStore, removePet, setError } =
    useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const fetchPets = async (customerId: string, opts?: { append?: boolean }) => {
    if (!customerId) {
      setErrorState('Selecione um cliente para listar os pets.');
      return [];
    }

    setIsLoading(true);
    setErrorState(null);
    try {
      const data = await listPets(customerId);
      if (opts?.append) {
        setPets((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          data.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      } else {
        setPets(data);
      }
      return data;
    } catch (err: any) {
      // Se 404, retorna array vazio e mensagem amigável
      if (err?.status === 404) {
        if (!opts?.append) setPets([]);
        const friendly = 'Nenhum pet cadastrado para este cliente ainda.';
        setErrorState(friendly);
        setError(friendly);
      } else {
        const message = err instanceof Error ? err.message : 'Erro ao carregar pets';
        setErrorState(message);
        setError(message);
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createNewPet = async (customerId: string, dto: CreatePetDto) => {
    try {
      const pet = await createPet(customerId, dto);
      addPet(pet);
      return pet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
    }
  };

  // updateExistingPet e deleteExistingPet removidos pois dependiam de endpoints inexistentes

  return {
    pets,
    isLoading,
    error,
    fetchPets,
    createNewPet,
  };
}
