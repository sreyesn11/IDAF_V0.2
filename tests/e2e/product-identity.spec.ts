import { test, expect } from '@playwright/test';
import { loginAs } from './_session';

/**
 * US2 — Login + Inicio (SC-006/007/017/036/037). FR-027 (a)-(c) aquí; (d)/(e)
 * dependen de `ModuleHeader`/`Surface` y se verifican en
 * `structure-consistency.spec.ts` (US5) / `global-consistency.spec.ts` (Polish).
 */
test.describe('Identidad de producto en Login e Inicio (US2)', () => {
  test('Login muestra el nombre IDAF + símbolo de marca + propósito (F1/F7; FR-028/029)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'IDAF' })).toBeVisible();
    const brandIcon = page.locator('.login-view__brand svg');
    await expect(brandIcon).toBeVisible();
    await expect(page.locator('.login-view__purpose')).toContainText('red e IoT');
  });

  test('Inicio muestra el mismo símbolo de marca en el header persistente (FR-028)', async ({ page }) => {
    await loginAs(page);
    const headerBrandIcon = page.locator('.app-shell__header .brand svg');
    await expect(headerBrandIcon).toBeVisible();
    await expect(page.locator('.app-shell__header .brand-name')).toHaveText('IDAF');
  });

  test('el botón de Login y "Cerrar sesión" comparten el mismo radio de borde (mismo token) — F7/SC-037', async ({
    page,
  }) => {
    await page.goto('/login');
    const loginRadius = await page
      .getByRole('button', { name: 'Iniciar sesión' })
      .evaluate((el) => getComputedStyle(el).borderRadius);

    await loginAs(page);
    const logoutRadius = await page
      .getByRole('button', { name: 'Cerrar sesión' })
      .evaluate((el) => getComputedStyle(el).borderRadius);

    expect(loginRadius).toBe(logoutRadius);
  });

  test('Login no contiene imágenes ni adornos puramente decorativos (F7; SC-037)', async ({ page }) => {
    await page.goto('/login');
    expect(await page.locator('img').count()).toBe(0);
    expect(await page.locator('canvas').count()).toBe(0);
  });

  test('las cuatro zonas del AppShell son distinguibles en Inicio (SC-017)', async ({ page }) => {
    await loginAs(page);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByLabel('Sesión')).toBeVisible();
  });

  test('el identificador de una familia iconográfica única: los iconos de nav y el de marca comparten viewBox 24×24 (I1)', async ({
    page,
  }) => {
    await loginAs(page);
    const viewBoxes = await page.locator('svg').evaluateAll((svgs) => svgs.map((svg) => svg.getAttribute('viewBox')));
    for (const vb of viewBoxes) {
      expect(vb).toBe('0 0 24 24');
    }
  });
});
