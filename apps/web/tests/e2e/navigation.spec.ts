import { expect, test } from '@playwright/test';
import { setupMockBackend } from './support/mock-backend';
import { loginAs } from './support/test-helpers';

test.describe('Navegação e breadcrumbs', () => {
  test('navega pelo menu lateral e usa breadcrumbs para voltar', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);

    const customersLink = page.getByRole('link', { name: 'Clientes' });
    await customersLink.click();
    await page.waitForURL('**/admin/customers');
    await expect(customersLink).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('navigation', { name: 'Trilha de navegação' })).toContainText(/Dashboard\s*\/\s*Clientes/);

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('**/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('botões de voltar mantêm o contexto anterior', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);

    await page.getByRole('link', { name: 'Agenda' }).click();
    await page.waitForURL('**/admin/appointments');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();

    await page.getByRole('button', { name: /Novo Agendamento/ }).click();
    await page.waitForURL('**/admin/appointments/new');
    await expect(page.getByRole('heading', { name: 'Novo Agendamento' })).toBeVisible();
    await page.getByRole('button', { name: 'Voltar' }).click();
    await page.waitForURL('**/admin/appointments');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
  });
});
