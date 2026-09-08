import { test, expect } from '@playwright/test';

test.describe('Recarga y acceso directo (US2 escenario 5, FR-027 / EC-06)', () => {
  test('estar en /topologia, recargar → sigue en /topologia con navegación usable', async ({
    page,
  }) => {
    await page.goto('/topologia');
    await expect(page.getByRole('heading', { level: 1, name: 'Topología' })).toBeVisible();

    await page.reload();

    // Único resultado aceptado por FR-027: se conserva la misma ruta y vista.
    await expect(page).toHaveURL(/\/topologia$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Topología' })).toBeVisible();

    // La navegación principal sigue visible y utilizable.
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
    await page.getByRole('link', { name: 'Inicio', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'IDAF' })).toBeVisible();
  });

  test('acceso directo por URL a /diagnosticos (carga nueva) muestra Diagnósticos', async ({
    page,
  }) => {
    await page.goto('/diagnosticos');
    await expect(page).toHaveURL(/\/diagnosticos$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Diagnósticos' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
  });
});
