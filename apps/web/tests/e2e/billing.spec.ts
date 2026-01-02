import { expect, test } from '@playwright/test';
import { setupMockBackend } from './support/mock-backend';
import { loginAs } from './support/test-helpers';

test.describe('Billing e assinatura', () => {
  test('ativa um plano via checkout', async ({ page }) => {
    await setupMockBackend(page, { state: { billingSubscription: null } });
    await loginAs(page);

    await page.goto('/admin/billing');
    await expect(page.getByText('Nenhum plano ativo')).toBeVisible();
    await page.getByRole('button', { name: 'Ativar assinatura' }).click();
    await page.waitForURL('**/admin/billing/checkout');

    await expect(page.getByRole('heading', { name: 'Escolha seu plano' })).toBeVisible();
    await page.locator('select').selectOption('PRO');
    await page.getByRole('button', { name: 'Assinar' }).click();
    await expect(page.getByText('Assinatura criada com sucesso!')).toBeVisible();

    await page.getByRole('button', { name: 'Voltar' }).click();
    await page.waitForURL('**/admin/billing');
    await expect(page.getByText('Plano atual: PRO')).toBeVisible();
  });

  test('cancela o plano atual', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);

    await page.goto('/admin/billing/cancel');
    await expect(page.getByRole('heading', { name: 'Cancelar assinatura' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar assinatura' }).click();
    await expect(page.getByText('Assinatura cancelada com sucesso')).toBeVisible();
  });

  test('restringe acesso para usuário staff', async ({ page }) => {
    await setupMockBackend(page, { userRole: 'STAFF' });
    await loginAs(page);

    await page.goto('/admin/billing');
    await expect(page.getByText('Apenas administradores podem acessar esta página.')).toBeVisible();
  });
});
