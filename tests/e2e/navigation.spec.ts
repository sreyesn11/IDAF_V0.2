import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';

test.describe('Navegación entre todas las áreas (US2)', () => {
  test('desde Inicio se alcanza cada una de las 7 áreas; URL y encabezado coinciden', async ({
    page,
  }) => {
    await page.goto('/');
    for (const area of AREAS) {
      await page.getByRole('link', { name: area.label, exact: true }).click();
      const expectedUrl = area.path === '/' ? '/' : area.path;
      await expect(page).toHaveURL(new RegExp(`${expectedUrl.replace('/', '\\/')}$`));
      await expect(page.getByRole('heading', { level: 1, name: area.heading })).toBeVisible();
    }
  });

  test('de Topología a Inventario en un paso, sin recarga de documento', async ({ page }) => {
    await page.goto('/topologia');
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
    for (const area of AREAS.filter((a) => a.path !== '/')) {
      await page.goto(area.path);
      await page.getByRole('link', { name: 'Inicio', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('heading', { level: 1, name: 'IDAF' })).toBeVisible();
    }
  });

  test('la entrada de navegación de la ruta actual expone aria-current="page"', async ({ page }) => {
    await page.goto('/diagnosticos');
    const current = page.locator('nav a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('Diagnósticos');
  });

  test('la primera carga de "/" no muestra ningún formulario ni control de inicio de sesión', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'IDAF' })).toBeVisible();
    expect(await page.locator('input[type="password"]').count()).toBe(0);
    expect(await page.getByRole('button', { name: /iniciar sesión|log ?in|entrar/i }).count()).toBe(0);
    expect(await page.getByText(/iniciar sesión|log ?in/i).count()).toBe(0);
  });
});
