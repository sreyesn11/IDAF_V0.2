import { test, expect } from '@playwright/test';
import { loginAs, secondaryAccount } from './_session';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test.describe('Casos límite de estructura (US7; SC-020/021)', () => {
  test('un identificador de usuario ≥40 caracteres no desplaza ni oculta la navegación (SC-020)', async ({ page }) => {
    const account = secondaryAccount();
    expect(account.displayName.length).toBeGreaterThanOrEqual(40);
    await loginAs(page, account);

    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
    const logoutButton = page.getByRole('button', { name: 'Cerrar sesión' });
    await expect(logoutButton).toBeVisible();
    await expect(page.locator('.session-bar__name')).toHaveAttribute('title', account.displayName);

    const box = await logoutButton.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  });

  test('un mensaje de error de ≥200 caracteres no se superpone a los campos ni al botón (FR-047; SC-020)', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario', { exact: true }).fill('alice');
    await page.getByLabel('Contraseña', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();

    const longMessage = 'Este es un mensaje de error simulado muy largo para verificar que la interfaz de acceso no se rompe. '.repeat(3);
    expect(longMessage.length).toBeGreaterThanOrEqual(200);
    await alert.evaluate((el, text) => {
      el.textContent = text;
    }, longMessage);

    const alertBox = (await alert.boundingBox())!;
    const buttonBox = (await page.getByRole('button', { name: 'Iniciar sesión' }).boundingBox())!;
    const passwordBox = (await page.getByLabel('Contraseña', { exact: true }).boundingBox())!;

    expect(overlaps(alertBox, buttonBox)).toBe(false);
    expect(overlaps(alertBox, passwordBox)).toBe(false);
  });

  test('a 1024px de ancho, nav + sesión + "Cerrar sesión" siguen visibles y utilizables (SC-021)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await loginAs(page);

    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
    await expect(page.getByLabel('Sesión')).toBeVisible();
    const logoutButton = page.getByRole('button', { name: 'Cerrar sesión' });
    await expect(logoutButton).toBeVisible();

    await logoutButton.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
