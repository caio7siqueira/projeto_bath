import { expect, test } from '@playwright/test';
import { setupMockBackend, type CustomHandler } from './support/mock-backend';
import { loginAs } from './support/test-helpers';

test.describe('Cadastros de clientes, pets e serviços', () => {
  test('cria um novo cliente', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);

    await page.getByRole('link', { name: 'Clientes' }).click();
    await page.getByRole('button', { name: 'Novo Cliente' }).first().click();
    await expect(page.getByRole('heading', { name: 'Novo Cliente' })).toBeVisible();

    await page.getByLabel('Nome').fill('Mariana Souza');
    await page.getByLabel('Telefone').fill('(11) 98888-0000');
    await page.getByLabel('Email').fill('mariana@teste.com');
    await page.getByRole('button', { name: 'Criar Cliente' }).click();

    await expect(page.getByText('Cliente criado com sucesso!')).toBeVisible();
    await page.waitForURL('**/admin/customers');
    await page.waitForResponse((response) => {
      return response.url().includes('/v1/customers') && response.request().method() === 'GET';
    });
    await expect(page.getByText('Mariana Souza')).toBeVisible();
  });

  test('cria pet associado a um cliente', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);

    await page.goto('/admin/pets/new');
    await expect(page.getByRole('heading', { name: 'Novo Pet' })).toBeVisible();
    await page.getByLabel('Cliente').selectOption('cust-1');
    await page.getByLabel('Nome do Pet').fill('Scooby');
    await page.getByLabel('Espécie').selectOption('DOG');
    await page.getByRole('button', { name: 'Criar Pet' }).click();
    await page.waitForURL('**/admin/pets');
    await expect(page.getByRole('heading', { name: 'Pets' })).toBeVisible();
  });

  test('cria serviço e volta para a lista', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);

    await page.goto('/admin/services/new');
    await expect(page.getByRole('heading', { name: 'Novo Serviço' })).toBeVisible();
    await page.getByLabel('Nome').fill('Spa Pet Premium');
    await page.getByLabel('Descrição (opcional)').fill('Hidratação aromática completa');
    await page.getByLabel('Duração base (minutos)').fill('75');
    await page.getByRole('button', { name: 'Criar Serviço' }).click();
    await expect(page.getByText('Serviço criado com sucesso!')).toBeVisible();
    await page.waitForURL('**/admin/services');
    await expect(page.getByText('Serviços cadastrados')).toBeVisible();
  });

  test('mostra erro quando o serviço está duplicado', async ({ page }) => {
    const duplicateHandler: CustomHandler = {
      match: (request, url) => request.method() === 'POST' && url.pathname.endsWith('/v1/services'),
      once: true,
      handle: async (route) => {
        await route.fulfill({
          status: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: 'SERVICE_DUPLICATE_NAME',
            message: 'Nome de serviço já está em uso',
            details: [{ field: 'name', message: 'Nome duplicado' }],
          }),
        });
      },
    };

    await setupMockBackend(page, { customHandlers: [duplicateHandler] });
    await loginAs(page);

    await page.goto('/admin/services/new');
    await page.getByLabel('Nome').fill('Banho Completo');
    await page.getByLabel('Duração base (minutos)').fill('60');
    await page.getByRole('button', { name: 'Criar Serviço' }).click();
    const duplicateBanner = page.getByRole('alert').filter({ hasText: 'Nome de serviço em uso' });
    await expect(duplicateBanner).toBeVisible();
  });
});
