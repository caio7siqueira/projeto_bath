import { create } from 'zustand';
import type { Customer, Pet } from './api/customers';
import type { Appointment } from './api/appointments';

interface AppStore {
  customers: Customer[];
  pets: Pet[];
  appointments: Appointment[];
  selectedCustomer: Customer | null;
  selectedPet: Pet | null;
  isLoading: boolean;
  error: string | null;

  // Customer actions
  setCustomers: (customers: Customer[]) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomerInStore: (id: string, customer: Customer) => void;
  removeCustomer: (id: string) => void;

  // Pet actions
  setPets: (pets: Pet[]) => void;
  setSelectedPet: (pet: Pet | null) => void;
  addPet: (pet: Pet) => void;
  updatePetInStore: (id: string, pet: Pet) => void;
  removePet: (id: string) => void;

  // Appointment actions
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentInStore: (id: string, appointment: Appointment) => void;
  removeAppointment: (id: string) => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  customers: [],
  pets: [],
  appointments: [],
  selectedCustomer: null,
  selectedPet: null,
  isLoading: false,
  error: null,

  setCustomers: (customers) => set({ customers }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomerInStore: (id, customer) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? customer : c)),
    })),
  removeCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    })),

  setPets: (pets) => set({ pets }),
  setSelectedPet: (pet) => set({ selectedPet: pet }),
  addPet: (pet) => set((state) => ({ pets: [...state.pets, pet] })),
  updatePetInStore: (id, pet) =>
    set((state) => ({
      pets: state.pets.map((p) => (p.id === id ? pet : p)),
    })),
  removePet: (id) =>
    set((state) => ({
      pets: state.pets.filter((p) => p.id !== id),
    })),

  setAppointments: (appointments) => set({ appointments }),
  addAppointment: (appointment) =>
    set((state) => ({ appointments: [...state.appointments, appointment] })),
  updateAppointmentInStore: (id, appointment) =>
    set((state) => ({
      appointments: state.appointments.some((a) => a.id === id)
        ? state.appointments.map((a) => (a.id === id ? appointment : a))
        : [...state.appointments, appointment],
    })),
  removeAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
