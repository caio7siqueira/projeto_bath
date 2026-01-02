import { expect, test } from '@playwright/test';
import { setupMockBackend, type CustomHandler } from './support/mock-backend';
import { loginAs } from './support/test-helpers';

test.describe('Auth flows', () => {
  test('logs in and loads dashboard metrics', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Visão geral rápida dos principais indicadores do petshop.')).toBeVisible();
    await expect(page.getByText('Total de Clientes')).toBeVisible();
  });

  test('shows banner on invalid credentials', async ({ page }) => {
    const invalidLoginHandler: CustomHandler = {
      match: (request, url) => request.method() === 'POST' && url.pathname.endsWith('/v1/auth/login'),
      once: true,
      handle: async (route) => {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({
            code: 'AUTH_INVALID_CREDENTIALS',
            message: 'Email ou senha inválidos.',
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      },
    };

    await setupMockBackend(page, { customHandlers: [invalidLoginHandler] });
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@demo.com');
    await page.getByLabel('Senha').fill('wrong-pass');
    await page.getByRole('button', { name: 'Entrar' }).click();
    const invalidBanner = page.locator('[data-error-scenario="login-invalid-credentials"]');
    await expect(invalidBanner).toContainText('Credenciais inválidas');
    await expect(invalidBanner).toContainText('Email ou senha não conferem');
  });

  test('redirects unauthenticated access to login', async ({ page }) => {
    await setupMockBackend(page);
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Efizion Bath' })).toBeVisible();
  });
});
