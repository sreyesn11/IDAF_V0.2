import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';
import { loginAs } from './_session';

test.describe('Identidad de sesión y cierre de sesión explícito (US4; SC-004/008/009)', () => {
  test('identidad + "Cerrar sesión" están visibles desde las 7 áreas, separados de la nav', async ({ page }) => {
    await loginAs(page);
    for (const area of AREAS) {
      if (area.path !== '/') {
        await page.getByRole('link', { name: area.label, exact: true }).click();
      }
      const sessionRegion = page.getByLabel('Sesión');
      await expect(sessionRegion).toBeVisible();
      await expect(sessionRegion.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
      // La región de sesión y la navegación son landmarks distintos (FR-015).
      await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
    }
  });

  test('cerrar sesión desde /diagnosticos invalida la sesión y vuelve a Login con foco en Usuario (SC-004/008/009)', async ({
    page,
  }) => {
    await loginAs(page);
    await page.getByRole('link', { name: 'Diagnósticos', exact: true }).click();

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('Usuario', { exact: true })).toBeFocused();

    const sessionResponse = await page.request.get('/api/auth/session');
    expect(await sessionResponse.json()).toEqual({ authenticated: false });

    await page.goto('/inventario');
    await expect(page).toHaveURL(/\/login$/);
  });
});
