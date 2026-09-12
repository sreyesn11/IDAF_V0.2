import { test, expect } from '@playwright/test';
import { loginAs } from './_session';

test.describe('Ruta desconocida (FR-053; SC-023)', () => {
  test('con sesión, goto(/ruta-inexistente) aterriza en Inicio, sin error', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await loginAs(page);
    await page.goto('/ruta-inexistente');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/not found|404|stack|exception|cannot GET/i);
    expect(errors).toEqual([]);
  });

  test('la redirección con sesión reemplaza el historial (Back no vuelve a la URL inválida)', async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto('/otra-ruta-inexistente');
    await expect(page).toHaveURL(/\/$/);

    await page.goBack();
    await expect(page).not.toHaveURL(/otra-ruta-inexistente/);
  });

  test('sin sesión, cualquier ruta (incluida una desconocida) muestra Login', async ({ page }) => {
    await page.goto('/ruta-inexistente');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });
});
