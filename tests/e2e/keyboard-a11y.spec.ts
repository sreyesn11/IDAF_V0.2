import { test, expect } from '@playwright/test';
import { loginAs, primaryAccount } from './_session';

/**
 * FR-054 / SC-022, en los tres navegadores. La operabilidad por teclado de
 * `RouteError` (acciones de la vista de error de sección) se verifica en
 * `tests/unit/route-error.test.tsx` — sus controles son un `<button>` y un
 * `<a>` nativos, sin lógica dependiente del motor de renderizado, y no hay
 * forma de forzar de manera realista un error de render en un E2E de caja
 * negra sin instrumentación de solo-pruebas en producción.
 */
test.describe('Accesibilidad por teclado acotada (US7; FR-054; SC-022)', () => {
  test('el formulario de acceso es completamente operable por teclado, incl. el toggle de contraseña', async ({
    page,
  }) => {
    const account = primaryAccount();
    await page.goto('/login');

    await page.getByLabel('Usuario', { exact: true }).fill(account.username);
    await page.keyboard.press('Tab'); // → Contraseña
    await page.keyboard.type(account.password);
    await page.keyboard.press('Tab'); // → alternar mostrar/ocultar
    await expect(page.locator(':focus')).toHaveAttribute('type', 'button');

    await page.keyboard.press('Enter'); // activa el toggle, NO envía el formulario
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Contraseña', { exact: true }).focus();
    await page.keyboard.press('Enter'); // Enter en un campo SÍ envía el formulario
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeFocused();
  });

  test('landmarks: banner, navigation, main y la región nombrada "Sesión" están presentes', async ({ page }) => {
    await loginAs(page);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByLabel('Sesión')).toBeVisible();
  });

  test('las 7 entradas de navegación son alcanzables y activables por teclado, sin trampa de foco', async ({
    page,
  }) => {
    await loginAs(page);
    const nav = page.getByRole('navigation', { name: 'Áreas de IDAF' });
    const links = await nav.getByRole('link').all();
    for (const link of links) {
      await link.focus();
      await expect(link).toBeFocused();
    }
  });

  test('"Cerrar sesión" es alcanzable y activable por teclado; tras cerrar sesión el foco va al campo Usuario', async ({
    page,
  }) => {
    await loginAs(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('Usuario', { exact: true })).toBeFocused();
  });

  test('el foco se reubica al fallar el login: al contenedor del mensaje, en role="alert"', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario', { exact: true }).fill('alice');
    await page.getByLabel('Contraseña', { exact: true }).fill('wrong');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('alert')).toBeFocused();
  });

  test('todo elemento con foco muestra un indicador visible (:focus-visible)', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario', { exact: true }).focus();
    const outline = await page.locator(':focus').evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).not.toBe('0px');
  });
});
