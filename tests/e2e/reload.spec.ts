import { test, expect } from '@playwright/test';
import { loginAs } from './_session';

test.describe('Recarga y acceso directo con sesión (US7 escenario 5, FR-009 / SC-005)', () => {
  test('estar en /topologia, recargar → sigue en /topologia con navegación usable', async ({
    page,
  }) => {
    await loginAs(page);
    await page.getByRole('link', { name: 'Topología', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Topología' })).toBeVisible();

    await page.reload();

    // Único resultado aceptado: se conserva la misma ruta y vista (FR-009).
    await expect(page).toHaveURL(/\/topologia$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Topología' })).toBeVisible();

    // La navegación principal sigue visible y utilizable.
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
    await page.getByRole('link', { name: 'Inicio', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
  });

  test('acceso directo por URL a /diagnosticos (carga nueva, con sesión) muestra Diagnósticos', async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto('/diagnosticos');
    await expect(page).toHaveURL(/\/diagnosticos$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Diagnósticos' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
  });
});
