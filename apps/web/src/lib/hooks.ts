import { useState } from 'react';
import { listServices, type Service } from './api/services';
export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const fetchServices = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const data = await listServices();
      setServices(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    services,
    isLoading,
    error,
    fetchServices,
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
  updatePet,
  deletePet,
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

  const fetchPets = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const data = await listPets();
      setPets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
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

  const updateExistingPet = async (id: string, dto: UpdatePetDto) => {
    try {
      const pet = await updatePet(id, dto);
      updatePetInStore(id, pet);
      return pet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
    }
  };

  const deleteExistingPet = async (id: string) => {
    try {
      await deletePet(id);
      removePet(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorState(message);
      setError(message);
      throw err;
    }
  };

  return {
    pets,
    isLoading,
    error,
    fetchPets,
    createNewPet,
    updateExistingPet,
    deleteExistingPet,
  };
}
