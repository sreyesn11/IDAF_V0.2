import { test, expect } from '@playwright/test';
import { loginAs } from './_session';

test.describe('Cierre de sesión con varias pestañas (US4; SC-029; CL-11)', () => {
  test('logout en la pestaña A → B muestra Login al reactivarse (focus) y al recargar', async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await loginAs(pageA);
    await pageB.goto('/observabilidad');
    await expect(pageB.getByRole('heading', { level: 1, name: 'Observabilidad' })).toBeVisible();

    await pageA.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(pageA).toHaveURL(/\/login$/);

    // B se reactiva (focus de ventana) → revalida contra el servicio → anonymous.
    await pageB.bringToFront();
    await pageB.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(pageB).toHaveURL(/\/login$/, { timeout: 10000 });

    await pageA.close();
    await pageB.close();
  });

  test('alternativa: recargar en B tras el logout de A también lleva a Login', async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await loginAs(pageA);
    await pageB.goto('/conexiones');
    await expect(pageB.getByRole('heading', { level: 1, name: 'Conexiones' })).toBeVisible();

    await pageA.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(pageA).toHaveURL(/\/login$/);

    await pageB.reload();
    await expect(pageB).toHaveURL(/\/login$/);

    // Ninguna navegación posterior en B alcanza las áreas internas.
    await pageB.goto('/inventario');
    await expect(pageB).toHaveURL(/\/login$/);

    await pageA.close();
    await pageB.close();
  });
});
