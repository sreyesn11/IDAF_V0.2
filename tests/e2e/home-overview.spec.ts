import { test, expect } from '@playwright/test';
import { loginAs } from './_session';

test.describe('Inicio — identidad + propósito + vista general de 7 áreas (US5; SC-030)', () => {
  test('muestra la identidad del producto (header), el propósito y las 7 áreas con estado', async ({ page }) => {
    await loginAs(page);

    await expect(page.locator('.app-shell__header .brand-name')).toHaveText('IDAF');
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
    await expect(page.locator('main')).toContainText('red e IoT');

    const items = page.locator('.home-view__areas li');
    await expect(items).toHaveCount(7);
    await expect(page.getByText('Disponible', { exact: true })).toHaveCount(1);
    await expect(page.getByText('No disponible', { exact: true })).toHaveCount(6);
  });

  test('no muestra tablas, métricas, gráficas ni valores operacionales', async ({ page }) => {
    await loginAs(page);
    expect(await page.locator('main table').count()).toBe(0);
    const bodyText = (await page.locator('main').innerText()).toLowerCase();
    expect(bodyText).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/);
  });

  test('PrimaryNav permanece visible en Inicio (no sustituida por la vista general)', async ({ page }) => {
    await loginAs(page);
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
  });
});
