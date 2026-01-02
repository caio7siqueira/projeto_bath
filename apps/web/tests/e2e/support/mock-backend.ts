import type { Page, Request, Route } from '@playwright/test';
import type { DashboardStats } from '@/lib/api/dashboard';
import type { Customer, Pet } from '@/lib/api/customers';
import type { Appointment } from '@/lib/api/appointments';
import type { Service } from '@/lib/api/services';
import type { Location } from '@/lib/api/locations';
import type { BillingSubscription } from '@/lib/api/billing';

export type UserRole = 'ADMIN' | 'STAFF' | 'SUPER_ADMIN';

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

interface SequenceState {
  customer: number;
  pet: number;
  service: number;
  location: number;
  appointment: number;
}

export interface MockState {
  user: MockUser;
  dashboard: DashboardStats;
  customers: Customer[];
  pets: Pet[];
  services: Service[];
  locations: Location[];
  appointments: Appointment[];
  billingSubscription: BillingSubscription | null;
  sequences: SequenceState;
}

export interface CustomHandlerContext {
  state: MockState;
  parseBody: <T = Record<string, unknown>>(request: Request) => T;
  fulfillJson: (route: Route, body: unknown, status?: number) => Promise<void>;
}

export interface CustomHandler {
  match: (request: Request, url: URL) => boolean;
  handle: (route: Route, context: CustomHandlerContext) => Promise<void>;
  once?: boolean;
}

export interface SetupMockOptions {
  userRole?: UserRole;
  state?: Partial<Omit<MockState, 'sequences' | 'user'>>;
  customHandlers?: CustomHandler[];
}

const DEFAULT_PASSWORD = 'Admin123!';

export async function setupMockBackend(page: Page, options?: SetupMockOptions) {
  const baseState = createDefaultState(options?.userRole);
  const state: MockState = {
    ...baseState,
    ...options?.state,
    dashboard: {
      ...baseState.dashboard,
      ...(options?.state?.dashboard ?? {}),
    },
  };

  if (options?.state?.customers) state.customers = options.state.customers;
  if (options?.state?.pets) state.pets = options.state.pets;
  if (options?.state?.services) state.services = options.state.services;
  if (options?.state?.locations) state.locations = options.state.locations;
  if (options?.state?.appointments) state.appointments = options.state.appointments;
  if (options?.state?.billingSubscription !== undefined) {
    state.billingSubscription = options.state.billingSubscription;
  }

  recomputeSequences(state);

  const customHandlers: CustomHandler[] = [...(options?.customHandlers ?? [])];

  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const normalizedPath = normalizePath(url.pathname);

    const context: CustomHandlerContext = {
      state,
      parseBody: (req) => parseBody(req),
      fulfillJson: (rt, body, status = 200) => fulfillJson(rt, body, status),
    };

    const handlerIndex = customHandlers.findIndex((handler) => handler.match(request, url));
    if (handlerIndex >= 0) {
      const handler = customHandlers[handlerIndex];
      if (handler.once) {
        customHandlers.splice(handlerIndex, 1);
      }
      await handler.handle(route, context);
      return;
    }

    switch (true) {
      case normalizedPath === '/auth/login' && request.method() === 'POST':
        await handleLogin(route, request, state);
        return;
      case normalizedPath === '/auth/logout' && request.method() === 'POST':
        await fulfillJson(route, { data: { success: true } });
        return;
      case normalizedPath === '/auth/refresh' && request.method() === 'POST':
        await fulfillJson(route, {
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
        });
        return;
      case normalizedPath === '/dashboard/reports' && request.method() === 'GET':
        await fulfillJson(route, { data: state.dashboard });
        return;
      case normalizedPath === '/customers' && request.method() === 'GET':
        await fulfillJson(route, createCollection(state.customers));
        return;
      case normalizedPath === '/customers' && request.method() === 'POST':
        await handleCreateCustomer(route, request, state);
        return;
      case /^\/customers\/[^/]+$/.test(normalizedPath) && request.method() === 'GET':
        await handleGetCustomer(route, normalizedPath, state);
        return;
      case /^\/customers\/[^/]+\/pets$/.test(normalizedPath) && request.method() === 'GET':
        await handleListCustomerPets(route, normalizedPath, state);
        return;
      case /^\/customers\/[^/]+\/pets$/.test(normalizedPath) && request.method() === 'POST':
        await handleCreatePet(route, request, normalizedPath, state);
        return;
      case normalizedPath === '/pets' && request.method() === 'GET':
        await fulfillJson(route, createCollection(state.pets));
        return;
      case normalizedPath === '/services' && request.method() === 'GET':
        await fulfillJson(route, createCollection(state.services));
        return;
      case normalizedPath === '/services' && request.method() === 'POST':
        await handleCreateService(route, request, state);
        return;
      case normalizedPath === '/locations' && request.method() === 'GET':
        await fulfillJson(route, createCollection(state.locations));
        return;
      case normalizedPath === '/appointments' && request.method() === 'GET':
        await fulfillJson(route, state.appointments);
        return;
      case normalizedPath === '/appointments' && request.method() === 'POST':
        await handleCreateAppointment(route, request, state);
        return;
      case /^\/appointments\/[^/]+$/.test(normalizedPath) && request.method() === 'GET':
        await handleGetAppointment(route, normalizedPath, state);
        return;
      case /^\/appointments\/[^/]+$/.test(normalizedPath) && request.method() === 'PATCH':
        await handleUpdateAppointment(route, request, normalizedPath, state);
        return;
      case /^\/appointments\/[^/]+\/cancel$/.test(normalizedPath) && request.method() === 'POST':
        await handleStatusChange(route, normalizedPath, state, 'CANCELLED');
        return;
      case /^\/appointments\/[^/]+\/mark-done$/.test(normalizedPath) && request.method() === 'POST':
        await handleStatusChange(route, normalizedPath, state, 'DONE');
        return;
      case normalizedPath === '/recurrence-series' && request.method() === 'POST':
        await fulfillJson(route, { data: { id: 'series-mock' } }, 201);
        return;
      case normalizedPath === '/admin/billing/subscription' && request.method() === 'GET':
        await fulfillJson(route, { data: state.billingSubscription });
        return;
      case normalizedPath === '/admin/billing/subscription' && request.method() === 'PUT':
        await handleUpsertSubscription(route, request, state);
        return;
      default:
        await fulfillJson(
          route,
          {
            code: 'NOT_MOCKED',
            message: `Sem mock configurado para ${request.method()} ${normalizedPath}`,
          },
          404,
        );
    }
  });

  return { state, defaultPassword: DEFAULT_PASSWORD };
}

function createDefaultState(role: UserRole = 'ADMIN'): MockState {
  const tenantId = 'tenant-1';
  const now = new Date();
  const iso = now.toISOString();

  const customers: Customer[] = [
    {
      id: 'cust-1',
      tenantId,
      name: 'Ana Beatriz',
      phone: '+55 11 99999-0001',
      email: 'ana@demo.com',
      cpf: '123.456.789-00',
      optInGlobal: true,
      isActive: true,
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: 'cust-2',
      tenantId,
      name: 'Carlos Silva',
      phone: '+55 11 99999-0002',
      email: 'carlos@demo.com',
      cpf: '987.654.321-00',
      optInGlobal: false,
      isActive: true,
      createdAt: iso,
      updatedAt: iso,
    },
  ];

  const pets: Pet[] = [
    {
      id: 'pet-1',
      tenantId,
      customerId: 'cust-1',
      name: 'Thor',
      species: 'DOG',
      lifeStatus: 'ALIVE',
      allowNotifications: true,
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: 'pet-2',
      tenantId,
      customerId: 'cust-2',
      name: 'Mia',
      species: 'CAT',
      lifeStatus: 'ALIVE',
      allowNotifications: true,
      createdAt: iso,
      updatedAt: iso,
    },
  ];

  const services: Service[] = [
    {
      id: 'srv-1',
      tenantId,
      name: 'Banho Completo',
      description: 'Bag completo com hidratação',
      baseDurationMinutes: 60,
      active: true,
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: 'srv-2',
      tenantId,
      name: 'Tosa Higiênica',
      description: 'Tosa rápida para pets de pequeno porte',
      baseDurationMinutes: 45,
      active: true,
      createdAt: iso,
      updatedAt: iso,
    },
  ];

  const locations: Location[] = [
    {
      id: 'loc-1',
      tenantId,
      name: 'Unidade Centro',
      createdAt: iso,
      updatedAt: iso,
    },
  ];

  const startDate = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const endDate = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const appointments: Appointment[] = [
    {
      id: 'apt-1',
      tenantId,
      customerId: 'cust-1',
      petId: 'pet-1',
      serviceId: 'srv-1',
      locationId: 'loc-1',
      startsAt: startDate,
      endsAt: endDate,
      status: 'SCHEDULED',
      notes: 'Primeiro agendamento',
      createdAt: iso,
      updatedAt: iso,
      recurrenceSeriesId: null,
    },
  ];

  const billingSubscription: BillingSubscription = {
    id: 'sub-1',
    tenantId,
    plan: 'STARTER',
    status: 'TRIAL',
    createdAt: iso,
    updatedAt: iso,
    trialEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const dashboard: DashboardStats = {
    totalCustomers: customers.length,
    totalPets: pets.length,
    totalAppointments: appointments.length,
    totalLocations: locations.length,
  };

  return {
    user: {
      id: 'user-1',
      email: 'admin@demo.com',
      name: 'Admin Demo',
      role,
      tenantId,
    },
    dashboard,
    customers,
    pets,
    services,
    locations,
    appointments,
    billingSubscription,
    sequences: {
      customer: customers.length,
      pet: pets.length,
      service: services.length,
      location: locations.length,
      appointment: appointments.length,
    },
  };
}

function normalizePath(pathname: string) {
  const sanitized = pathname.replace(/^\/v1/, '');
  if (sanitized === '') return '/';
  return sanitized.startsWith('/') ? sanitized : `/${sanitized}`;
}

function parseBody<T = Record<string, unknown>>(request: Request): T {
  const payload = request.postData();
  if (!payload) return {} as T;
  try {
    return JSON.parse(payload) as T;
  } catch {
    return {} as T;
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createCollection<T>(rows: T[]) {
  return {
    data: rows,
    meta: {
      page: 1,
      pageSize: rows.length,
      total: rows.length,
      totalPages: 1,
    },
  };
}

function recomputeSequences(state: MockState) {
  state.sequences = {
    customer: state.customers.length,
    pet: state.pets.length,
    service: state.services.length,
    location: state.locations.length,
    appointment: state.appointments.length,
  };
}

async function handleLogin(route: Route, request: Request, state: MockState) {
  const body = parseBody<{ email?: string }>(request);
  const user = { ...state.user, email: body.email ?? state.user.email };
  state.user = user;
  await fulfillJson(route, {
    data: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user,
      password: DEFAULT_PASSWORD,
    },
  });
}

async function handleCreateCustomer(route: Route, request: Request, state: MockState) {
  const { name, phone, email, cpf, optInGlobal = false } = parseBody<Partial<Customer>>(request);
  const id = `cust-${++state.sequences.customer}`;
  const timestamp = new Date().toISOString();
  const customer: Customer = {
    id,
    tenantId: state.user.tenantId,
    name: name ?? 'Cliente sem nome',
    phone: phone ?? 'N/D',
    email,
    cpf,
    optInGlobal,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  state.customers.unshift(customer);
  await fulfillJson(route, { data: customer }, 201);
}

async function handleGetCustomer(route: Route, path: string, state: MockState) {
  const id = path.split('/')[2];
  const customer = state.customers.find((c) => c.id === id);
  if (!customer) {
    await fulfillJson(route, { code: 'CUSTOMER_NOT_FOUND', message: 'Cliente não encontrado' }, 404);
    return;
  }
  await fulfillJson(route, { data: customer });
}

async function handleListCustomerPets(route: Route, path: string, state: MockState) {
  const customerId = path.split('/')[2];
  const pets = state.pets.filter((pet) => pet.customerId === customerId);
  await fulfillJson(route, createCollection(pets));
}

async function handleCreatePet(route: Route, request: Request, path: string, state: MockState) {
  const customerId = path.split('/')[2];
  const body = parseBody<Partial<Pet>>(request);
  const id = `pet-${++state.sequences.pet}`;
  const timestamp = new Date().toISOString();
  const pet: Pet = {
    id,
    tenantId: state.user.tenantId,
    customerId,
    name: body.name ?? 'Pet sem nome',
    species: body.species ?? 'DOG',
    lifeStatus: body.lifeStatus ?? 'ALIVE',
    allowNotifications: body.allowNotifications ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  state.pets.push(pet);
  await fulfillJson(route, { data: pet }, 201);
}

async function handleCreateService(route: Route, request: Request, state: MockState) {
  const body = parseBody<Partial<Service>>(request);
  const id = `srv-${++state.sequences.service}`;
  const timestamp = new Date().toISOString();
  const service: Service = {
    id,
    tenantId: state.user.tenantId,
    name: body.name ?? 'Serviço sem nome',
    description: body.description,
    baseDurationMinutes: body.baseDurationMinutes ?? 30,
    active: body.active ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  state.services.push(service);
  await fulfillJson(route, { data: service }, 201);
}

async function handleCreateAppointment(route: Route, request: Request, state: MockState) {
  const body = parseBody<Partial<Appointment>>(request);
  const id = `apt-${++state.sequences.appointment}`;
  const timestamp = new Date().toISOString();
  const appointment: Appointment = {
    id,
    tenantId: state.user.tenantId,
    customerId: body.customerId ?? state.customers[0]?.id ?? 'cust-unknown',
    petId: body.petId,
    serviceId: body.serviceId,
    locationId: body.locationId ?? state.locations[0]?.id ?? 'loc-unknown',
    startsAt: body.startsAt ?? timestamp,
    endsAt: body.endsAt ?? timestamp,
    status: 'SCHEDULED',
    notes: body.notes ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    recurrenceSeriesId: null,
  };
  state.appointments.push(appointment);
  await fulfillJson(route, { data: appointment }, 201);
}

async function handleGetAppointment(route: Route, path: string, state: MockState) {
  const id = path.split('/')[2];
  const appointment = state.appointments.find((apt) => apt.id === id);
  if (!appointment) {
    await fulfillJson(route, { code: 'APPOINTMENT_NOT_FOUND', message: 'Agendamento não encontrado' }, 404);
    return;
  }
  await fulfillJson(route, { data: appointment });
}

async function handleUpdateAppointment(route: Route, request: Request, path: string, state: MockState) {
  const id = path.split('/')[2];
  const appointment = state.appointments.find((apt) => apt.id === id);
  if (!appointment) {
    await fulfillJson(route, { code: 'APPOINTMENT_NOT_FOUND', message: 'Agendamento não encontrado' }, 404);
    return;
  }
  const body = parseBody<Partial<Appointment>>(request);
  Object.assign(appointment, body, { updatedAt: new Date().toISOString() });
  await fulfillJson(route, { data: appointment });
}

async function handleStatusChange(route: Route, path: string, state: MockState, status: Appointment['status']) {
  const id = path.split('/')[2];
  const appointment = state.appointments.find((apt) => apt.id === id);
  if (!appointment) {
    await fulfillJson(route, { code: 'APPOINTMENT_NOT_FOUND', message: 'Agendamento não encontrado' }, 404);
    return;
  }
  appointment.status = status;
  appointment.updatedAt = new Date().toISOString();
  await fulfillJson(route, { data: appointment });
}

async function handleUpsertSubscription(route: Route, request: Request, state: MockState) {
  const body = parseBody<Partial<BillingSubscription>>(request);
  const now = new Date().toISOString();
  const subscription: BillingSubscription = {
    id: state.billingSubscription?.id ?? 'sub-mock',
    tenantId: state.user.tenantId,
    plan: body.plan ?? state.billingSubscription?.plan ?? 'STARTER',
    status: body.status ?? state.billingSubscription?.status ?? 'ACTIVE',
    createdAt: state.billingSubscription?.createdAt ?? now,
    updatedAt: now,
    trialEndsAt: state.billingSubscription?.trialEndsAt,
  };
  state.billingSubscription = subscription;
  await fulfillJson(route, { data: subscription });
}
