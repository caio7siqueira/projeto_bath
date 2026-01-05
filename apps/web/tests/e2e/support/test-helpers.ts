import { expect, Page } from '@playwright/test';

export const defaultCredentials = {
  email: 'admin@demo.com',
  password: 'Admin123!',
};

export async function loginAs(page: Page, credentials = defaultCredentials) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Senha').fill(credentials.password);
  await Promise.all([
    page.waitForURL('**/admin/dashboard', { timeout: 15000 }),
    page.getByRole('button', { name: 'Entrar' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

export function datetimeLocal(minutesFromNow: number) {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return date.toISOString().slice(0, 16);
}
