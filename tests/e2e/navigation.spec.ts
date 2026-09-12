import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';
import { loginAs } from './_session';

test.describe('Navegación entre todas las áreas (US2, con sesión — Principio XII)', () => {
  test('desde Inicio se alcanza cada una de las 7 áreas; URL y encabezado coinciden', async ({
    page,
  }) => {
    await loginAs(page);
    for (const area of AREAS) {
      await page.getByRole('link', { name: area.label, exact: true }).click();
      const expectedUrl = area.path === '/' ? '/' : area.path;
      await expect(page).toHaveURL(new RegExp(`${expectedUrl.replace('/', '\\/')}$`));
      await expect(page.getByRole('heading', { level: 1, name: area.heading })).toBeVisible();
    }
  });

  test('de Topología a Inventario en un paso, sin recarga de documento', async ({ page }) => {
    await loginAs(page);
    await page.getByRole('link', { name: 'Topología', exact: true }).click();
    await expect(page).toHaveURL(/\/topologia$/);
    await page.evaluate(() => {
      (window as unknown as { __idafNoReload?: boolean }).__idafNoReload = true;
    });

    await page.getByRole('link', { name: 'Inventario', exact: true }).click();

    await expect(page).toHaveURL(/\/inventario$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Inventario' })).toBeVisible();
    const survived = await page.evaluate(
      () => (window as unknown as { __idafNoReload?: boolean }).__idafNoReload === true,
    );
    expect(survived).toBe(true);
  });

  test('se vuelve a Inicio desde cualquier área en un solo paso', async ({ page }) => {
    await loginAs(page);
    for (const area of AREAS.filter((a) => a.path !== '/')) {
      await page.getByRole('link', { name: area.label, exact: true }).click();
      await page.getByRole('link', { name: 'Inicio', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
    }
  });

  test('la entrada de navegación de la ruta actual expone aria-current="page"', async ({ page }) => {
    await loginAs(page);
    await page.getByRole('link', { name: 'Diagnósticos', exact: true }).click();
    const current = page.locator('nav a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText('Diagnósticos');
  });
});
