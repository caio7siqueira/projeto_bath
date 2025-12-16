import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  cpf: z.string().optional().or(z.literal('')),
  optInGlobal: z.boolean().optional(),
}).strict();

export const petSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  species: z.enum(['DOG', 'CAT']),
  lifeStatus: z.enum(['ALIVE', 'DECEASED']).optional(),
  allowNotifications: z.boolean().optional(),
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
