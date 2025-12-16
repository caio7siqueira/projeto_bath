import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  cpf: z.string().optional(),
  optInGlobal: z.boolean().optional(),
}).strict();

export const petSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  species: z.enum(['DOG', 'CAT']),
  lifeStatus: z.enum(['ALIVE', 'DECEASED']).optional(),
  allowNotifications: z.boolean().optional(),
}).strict();

export const appointmentSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  locationId: z.string().min(1, 'Local é obrigatório'),
  petId: z.string().optional().or(z.literal('')),
  serviceId: z.string().optional().or(z.literal('')),
  startsAt: z.string().min(1, 'Início é obrigatório'),
  endsAt: z.string().min(1, 'Fim é obrigatório'),
  notes: z.string().optional().or(z.literal('')),
  status: z
    .enum(['SCHEDULED', 'CANCELLED', 'COMPLETED', 'DONE', 'RESCHEDULED', 'NO_SHOW'])
    .optional(),
}).strict();

// Types for form data (with all fields being required for form submission)
export type CustomerFormData = {
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  optInGlobal?: boolean;
};

export type PetFormData = {
  name: string;
  species: 'DOG' | 'CAT';
  lifeStatus?: 'ALIVE' | 'DECEASED';
  allowNotifications?: boolean;
};

export type AppointmentFormData = {
  customerId: string;
  locationId: string;
  petId?: string;
  serviceId?: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  status?:
    | 'SCHEDULED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'DONE'
    | 'RESCHEDULED'
    | 'NO_SHOW';
};
