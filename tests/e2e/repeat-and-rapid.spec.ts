import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';
import { loginAs } from './_session';

function collectConsoleErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

test.describe('Reselección y alternancia rápida (US2/US3, EC-01/EC-02, SC-011)', () => {
  test('reseleccionar el área activa 10 veces: sin errores, un solo encabezado', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await loginAs(page);
    await page.getByRole('link', { name: 'Diagnósticos', exact: true }).click();

    for (let i = 0; i < 10; i++) {
      await page.getByRole('link', { name: 'Diagnósticos', exact: true }).click();
    }

    await expect(page).toHaveURL(/\/diagnosticos$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: 'Diagnósticos' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('alternar rápido 24 veces: solo la última área queda, la app sigue respondiendo', async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await loginAs(page);

    const sequence = AREAS.filter((a) => a.path !== '/');
    let last = sequence[0];
    for (let i = 0; i < 24; i++) {
      last = sequence[i % sequence.length];
      await page.getByRole('link', { name: last.label, exact: true }).click();
    }

    // Solo el encabezado de la última área seleccionada está en el DOM.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: last.heading })).toBeVisible();

    // La app sigue respondiendo a una navegación posterior.
    await page.getByRole('link', { name: 'Inicio', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();

    expect(errors).toEqual([]);
  });
});
