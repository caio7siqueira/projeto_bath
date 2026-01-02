import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { setupMockBackend } from './support/mock-backend';
import { loginAs } from './support/test-helpers';

const CAPTURE_DOCS = process.env.CAPTURE_DOCS === 'true';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/assets');

async function ensureScreenshotsDir() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
}

async function capture(page: Parameters<typeof loginAs>[0], name: string) {
  await ensureScreenshotsDir();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, name), fullPage: true });
}

test.describe('Documentação visual do painel admin', () => {
  test.skip(!CAPTURE_DOCS, 'Execute com CAPTURE_DOCS=true para atualizar as capturas de tela.');
  test.use({ viewport: { width: 1440, height: 900 } });
  test.describe.configure({ mode: 'serial' });

  test('Dashboard overview @docs', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await capture(page, 'dashboard.png');
  });

  test('Agenda administrativa @docs', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);
    await page.goto('/admin/appointments');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
    await capture(page, 'agenda.png');
  });

  test('Billing e assinatura @docs', async ({ page }) => {
    await setupMockBackend(page, { state: { billingSubscription: null } });
    await loginAs(page);
    await page.goto('/admin/billing');
    await expect(page.getByText('Nenhum plano ativo')).toBeVisible();
    await capture(page, 'billing.png');
  });

  test('Cadastro de clientes @docs', async ({ page }) => {
    await setupMockBackend(page);
    await loginAs(page);
    await page.goto('/admin/customers');
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
    await capture(page, 'cadastros.png');
  });
});
