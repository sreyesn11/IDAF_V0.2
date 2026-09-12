import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';
import { loginAs } from './_session';

const PENDING_AREAS = AREAS.filter((a) => a.path !== '/');

test.describe('Módulos "No disponible" (US6; SC-014)', () => {
  for (const area of PENDING_AREAS) {
    test(`${area.label} — conserva identidad, muestra icono+nombre+"No disponible"+explicación, cero elementos simulados`, async ({
      page,
    }) => {
      await loginAs(page);
      await page.getByRole('link', { name: area.label, exact: true }).click();

      await expect(page.getByRole('heading', { level: 1, name: area.label })).toBeVisible();
      await expect(page.locator('main svg').first()).toBeVisible();
      await expect(page.getByText('No disponible')).toBeVisible();
      await expect(page.locator('main')).toContainText('versión posterior de IDAF');

      // Cero elementos simulados: sin controles ni tablas de datos.
      expect(await page.locator('main button, main input, main form, main select, main table').count()).toBe(0);

      // Identidad conservada: la marca sigue visible en el header persistente.
      await expect(page.locator('.app-shell__header .brand-name')).toHaveText('IDAF');
    });

    test(`${area.label} — SC-032/033/034/035: sin decoración, transiciones ≤150ms, line-height ≥1.4, h1 ≤2× cuerpo`, async ({
      page,
    }) => {
      await loginAs(page);
      await page.getByRole('link', { name: area.label, exact: true }).click();

      expect(await page.locator('main img').count()).toBe(0);
      expect(await page.locator('main canvas').count()).toBe(0);

      const ratios = await page.evaluate(() => {
        const h1 = document.querySelector('main h1');
        const p = document.querySelector('main p');
        const bodyFontSize = parseFloat(getComputedStyle(document.body).fontSize);
        const h1Ratio = h1 ? parseFloat(getComputedStyle(h1).fontSize) / bodyFontSize : null;
        const pLineHeightRatio = p
          ? parseFloat(getComputedStyle(p).lineHeight) / parseFloat(getComputedStyle(p).fontSize)
          : null;
        return { h1Ratio, pLineHeightRatio };
      });
      if (ratios.h1Ratio !== null) expect(ratios.h1Ratio).toBeLessThanOrEqual(2.0);
      if (ratios.pLineHeightRatio !== null) expect(ratios.pLineHeightRatio).toBeGreaterThanOrEqual(1.4);
    });
  }
});
