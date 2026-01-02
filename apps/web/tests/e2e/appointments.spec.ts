import { expect, test } from '@playwright/test';
import { setupMockBackend, type CustomHandler } from './support/mock-backend';
import { datetimeLocal, loginAs } from './support/test-helpers';

test.describe('Agenda administrativa', () => {
  test('cria novo agendamento pela tela dedicada', async ({ page }) => {
    await setupMockBackend(page, { state: { appointments: [] } });
    await loginAs(page);

    await page.getByRole('link', { name: 'Agenda' }).click();
    await page.getByRole('button', { name: /Novo Agendamento/ }).click();
    await expect(page.getByRole('heading', { name: 'Novo Agendamento' })).toBeVisible();

    await page.locator('select[name="customerId"]').selectOption('cust-1');
    await page.locator('select[name="petId"] option[value="pet-1"]').waitFor({ state: 'attached' }); // aguarda pets carregarem
    await page.locator('select[name="petId"]').selectOption('pet-1');
    await page.locator('select[name="serviceId"]').selectOption('srv-1');
    await page.locator('select[name="locationId"]').selectOption('loc-1');

    const start = datetimeLocal(120);
    const end = datetimeLocal(180);
    await page.locator('input[name="startsAt"]').fill(start);
    await page.locator('input[name="endsAt"]').fill(end);
    await page.locator('input[name="notes"]').fill('Banho + hidratação completa');

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Agendamento criado com sucesso!')).toBeVisible();
    await page.waitForURL('**/admin/appointments');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
  });

  test('edita e cancela um agendamento existente', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);

    await page.goto('/admin/appointments/apt-1');
    await expect(page.getByRole('heading', { name: 'Editar Agendamento' })).toBeVisible();
    await page.getByLabel('Início').fill(datetimeLocal(60));
    await page.getByLabel('Fim').fill(datetimeLocal(120));
    await page.getByLabel('Status').selectOption('DONE');
    await page.getByLabel('Observações').fill('Cliente confirmou presença.');
    await page.getByRole('button', { name: 'Atualizar Agendamento' }).click();
    await page.waitForURL('**/admin/appointments');

    await page.goto('/admin/appointments/apt-1');
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await page.waitForURL('**/admin/appointments');
    await expect(page.getByText('Agenda')).toBeVisible();
  });

  test('exibe erro de conflito quando há duplicidade de horário', async ({ page }) => {
    const conflictHandler: CustomHandler = {
      match: (request, url) => request.method() === 'POST' && url.pathname.endsWith('/v1/appointments'),
      once: true,
      handle: async (route) => {
        await route.fulfill({
          status: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: 'APPOINTMENT_CONFLICT',
            message: 'Conflito detectado',
            conflictingAppointments: [
              {
                id: 'apt-conflict',
                startsAt: new Date().toISOString(),
                endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                customer: { name: 'Cliente em conflito' },
                pet: { name: 'Thor' },
                service: { name: 'Banho Completo' },
                location: { name: 'Unidade Centro' },
              },
            ],
            details: [{ field: 'startsAt', message: 'Já existe agendamento neste horário.' }],
          }),
        });
      },
    };

    await setupMockBackend(page, { customHandlers: [conflictHandler] });
    await loginAs(page);

    await page.getByRole('link', { name: 'Agenda' }).click();
    await page.getByRole('button', { name: /Novo Agendamento/ }).click();

    await page.locator('select[name="customerId"]').selectOption('cust-1');
    await page.locator('select[name="petId"] option[value="pet-1"]').waitFor({ state: 'attached' });
    await page.locator('select[name="petId"]').selectOption('pet-1');
    await page.locator('select[name="serviceId"]').selectOption('srv-1');
    await page.locator('select[name="locationId"]').selectOption('loc-1');
    await page.locator('input[name="startsAt"]').fill(datetimeLocal(30));
    await page.locator('input[name="endsAt"]').fill(datetimeLocal(60));

    await page.getByRole('button', { name: 'Salvar' }).click();
    const conflictBanner = page.locator('[data-error-scenario="appointments:create"]');
    await expect(conflictBanner).toContainText('Já existe agendamento conflitante');
    await expect(page.getByText('Agendamentos em conflito:')).toBeVisible();
  });
});
