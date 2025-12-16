import { useState } from 'react';
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
