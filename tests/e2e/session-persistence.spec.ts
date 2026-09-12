import { test, expect } from '@playwright/test';
import { loginAs } from './_session';

test.describe('Persistencia de sesión (US7; SC-005/024; CL-03/04/08)', () => {
  test('recargar una ruta interna con sesión conserva la sección y la navegación (FR-009)', async ({ page }) => {
    await loginAs(page);
    await page.getByRole('link', { name: 'Observabilidad', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Observabilidad' })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/observabilidad$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Observabilidad' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
  });

  test('recargar una ruta protegida sin sesión muestra Login (FR-010)', async ({ page }) => {
    await page.goto('/observabilidad');
    await expect(page).toHaveURL(/\/login$/);
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('vaciar sessionStorage (simula cierre de pestaña) + recargar → Login (CL-08; SC-024)', async ({ page }) => {
    await loginAs(page);
    await page.getByRole('link', { name: 'Inventario', exact: true }).click();

    await page.evaluate(() => window.sessionStorage.clear());
    await page.reload();

    await expect(page).toHaveURL(/\/login$/);
  });
});
