import { expect, test } from '@playwright/test';
import { setupMockBackend } from './support/mock-backend';
import { loginAs } from './support/test-helpers';

function configuredConnection() {
  const timestamp = new Date().toISOString();
  return {
    configured: true as const,
    source: 'TENANT' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

test.describe('Integração Omie', () => {
  test('permite salvar credenciais e testar conexão', async ({ page }) => {
    await setupMockBackend(page, {
      state: {
        omieConnection: {
          configured: false,
          source: null,
          createdAt: null,
          updatedAt: null,
        },
      },
    });

    await loginAs(page);
    await page.goto('/admin/settings/omie');

    await expect(page.getByRole('heading', { name: 'Omie' })).toBeVisible();
    await expect(page.getByText('Não Configurado')).toBeVisible();

    await page.getByRole('button', { name: 'Testar credenciais salvas' }).click();
    await expect(page.getByText('Configure credenciais ou informe appKey/appSecret para testar.')).toBeVisible();

    await page.fill('#omie-app-key', 'demo-app-key');
    await page.fill('#omie-app-secret', 'demo-app-secret');
    await page.getByRole('button', { name: 'Salvar credenciais' }).click();
    await expect(page.getByText('Credenciais atualizadas com sucesso.')).toBeVisible();

    await page.getByRole('button', { name: 'Testar credenciais salvas' }).click();
    await expect(page.getByText(/Teste concluído usando fonte/)).toBeVisible();
  });

  test('filtra eventos e reenfileira erros', async ({ page }) => {
    await setupMockBackend(page, {
      state: {
        omieConnection: configuredConnection(),
      },
    });

    await loginAs(page);
    await page.goto('/admin/settings/omie');

    await page.getByRole('button', { name: 'Erro' }).click();
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.getByText(/^Erro$/)).toBeVisible();
    await firstRow.getByRole('button', { name: 'Reprocessar' }).click();
    await expect(page.getByText('Nenhum evento encontrado para este filtro.')).toBeVisible();

    await page.getByRole('button', { name: 'Todos' }).click();
    await expect(page.locator('tbody tr').first().getByText(/^Pendente$/)).toBeVisible();
  });
});
