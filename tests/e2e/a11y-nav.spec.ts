import { test, expect, type Page } from '@playwright/test';
import { AREAS } from './_areas';
import { loginAs } from './_session';

/**
 * En WebKit, Playwright reproduce el comportamiento de Safari: `Tab` solo recorre
 * campos de formulario salvo que "Full Keyboard Access" esté activo; el recorrido
 * por TODOS los elementos enfocables (incluidos los enlaces) se hace con
 * `Alt+Tab` (equivalente a Option+Tab de Safari). En Chromium y Firefox es `Tab`.
 * La operabilidad por teclado exigida por FR-054 se valida así en los tres.
 */
function sequentialFocusKey(browserName: string): string {
  return browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
}

/**
 * Lleva el foco a la primera entrada de la navegación ("Inicio") usando solo el
 * teclado. Antes de la nav hay otros elementos enfocables en el header
 * (p. ej. "Cerrar sesión"), así que se reintenta la pulsación hasta que el foco
 * entra en la navegación; a partir de ahí el avance es determinista.
 */
async function focusFirstNavLink(page: Page, key: string): Promise<void> {
  await expect(async () => {
    await page.keyboard.press(key);
    await expect(page.locator(':focus')).toHaveText('Inicio', { timeout: 500 });
  }).toPass({ timeout: 8000 });
}

test.describe('Accesibilidad de la navegación principal (FR-054, con sesión)', () => {
  test('el foco secuencial alcanza las 7 entradas en el orden de FR-006', async ({
    page,
    browserName,
  }) => {
    await loginAs(page);
    const key = sequentialFocusKey(browserName);

    await focusFirstNavLink(page, key);
    const first = page.locator(':focus');
    expect((await first.evaluate((el) => el.tagName)).toLowerCase()).toBe('a');

    for (const area of AREAS.slice(1)) {
      await page.keyboard.press(key);
      const focused = page.locator(':focus');
      await expect(focused).toContainText(area.label);
      expect((await focused.evaluate((el) => el.tagName)).toLowerCase()).toBe('a');
    }
  });

  test('Enter sobre una entrada enfocada navega a esa área', async ({ page, browserName }) => {
    await loginAs(page);
    const key = sequentialFocusKey(browserName);

    await focusFirstNavLink(page, key); // Inicio
    await page.keyboard.press(key); // Inventario
    await page.keyboard.press(key); // Descubrimiento
    await expect(page.locator(':focus')).toContainText('Descubrimiento');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/descubrimiento$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Descubrimiento' })).toBeVisible();
  });

  test('la entrada enfocada muestra un indicador de foco visible', async ({ page, browserName }) => {
    await loginAs(page);
    await focusFirstNavLink(page, sequentialFocusKey(browserName));

    const outline = await page.locator(':focus').evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).not.toBe('0px');
  });

  test('la entrada del área actual expone aria-current="page"', async ({ page }) => {
    await loginAs(page);
    await page.getByRole('link', { name: 'Observabilidad', exact: true }).click();
    const current = page.locator('nav a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText('Observabilidad');
  });

  test('el nombre accesible de cada entrada coincide con su etiqueta visible', async ({ page }) => {
    await loginAs(page);
    for (const area of AREAS) {
      await expect(page.getByRole('link', { name: area.label, exact: true })).toContainText(area.label);
    }
  });
});
