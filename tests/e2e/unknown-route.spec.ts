import { test, expect } from '@playwright/test';

test.describe('Destino desconocido redirige a Inicio (FR-022 / EC-05, C6)', () => {
  test('goto(/ruta-inexistente) aterriza en "/" con Inicio y la navegación visibles', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto('/ruta-inexistente');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'IDAF' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();

    // Sin error crudo ni traza a la vista.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/not found|404|stack|exception|cannot GET/i);
    expect(errors).toEqual([]);
  });

  test('la redirección reemplaza el historial (Back no vuelve a la URL inválida)', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'IDAF' })).toBeVisible();

    await page.goto('/otra-ruta-inexistente');
    await expect(page).toHaveURL(/\/$/);

    await page.goBack();
    await expect(page).not.toHaveURL(/otra-ruta-inexistente/);
  });
});
