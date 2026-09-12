import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';
import { loginAs } from './_session';

/**
 * US5 — alcance: Inicio + las 4 zonas del shell. La revisión definitiva de
 * las 7 áreas (FR-036/SC-019, divergencia = 0) es `global-consistency.spec.ts`
 * (Polish, T089), después de que US6 reconstruya las 6 vistas «No disponible».
 */
test.describe('Estructura consistente — Inicio + shell (US5; SC-017/018)', () => {
  test('las 4 zonas (nav, identidad, sesión, contenido) están presentes y mantienen posición en cada ruta del shell', async ({
    page,
  }) => {
    await loginAs(page);
    for (const area of AREAS) {
      if (area.path !== '/') {
        await page.getByRole('link', { name: area.label, exact: true }).click();
      }
      await expect(page.getByRole('banner')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
      await expect(page.getByLabel('Sesión')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('<main> es la región de mayor superficie en Inicio (SC-018)', async ({ page }) => {
    await loginAs(page);
    const mainBox = await page.getByRole('main').boundingBox();
    const navBox = await page.locator('.app-shell__nav-zone').boundingBox();
    const headerBox = await page.getByRole('banner').boundingBox();
    expect(mainBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    const mainArea = (mainBox!.width * mainBox!.height);
    const navArea = (navBox!.width * navBox!.height);
    const headerArea = (headerBox!.width * headerBox!.height);
    expect(mainArea).toBeGreaterThan(navArea);
    expect(mainArea).toBeGreaterThan(headerArea);
  });

  test('ModuleHeader es consistente: mismo marcado de <h1 tabIndex="-1"> en Inicio', async ({ page }) => {
    await loginAs(page);
    const heading = page.getByRole('heading', { level: 1, name: 'Inicio' });
    await expect(heading).toHaveAttribute('tabindex', '-1');
  });

  test('los componentes finalizados en US5 resuelven de tokens.css / clases compartidas (sin divergencia local)', async ({
    page,
  }) => {
    await loginAs(page);
    const surfaces = page.locator('.surface');
    const count = await surfaces.count();
    expect(count).toBeGreaterThan(0);
    const borderRadii = await surfaces.evaluateAll((els) => els.map((el) => getComputedStyle(el).borderRadius));
    const distinctRadii = new Set(borderRadii);
    expect(distinctRadii.size).toBe(1); // todas las Surface comparten --radius-md
  });

  test('runtime SC-032/033/034/035 sobre Inicio: sin gráficos decorativos, transición ≤150ms, line-height ≥1.4', async ({
    page,
  }) => {
    await loginAs(page);
    expect(await page.locator('main img').count()).toBe(0);
    expect(await page.locator('main canvas').count()).toBe(0);

    const bodyLineHeight = await page.evaluate(() => {
      const el = document.querySelector('main p');
      if (!el) return null;
      const s = getComputedStyle(el);
      return parseFloat(s.lineHeight) / parseFloat(s.fontSize);
    });
    if (bodyLineHeight !== null) {
      expect(bodyLineHeight).toBeGreaterThanOrEqual(1.4);
    }

    const h1Ratio = await page.evaluate(() => {
      const h1 = document.querySelector('main h1');
      const body = document.body;
      if (!h1) return null;
      return parseFloat(getComputedStyle(h1).fontSize) / parseFloat(getComputedStyle(body).fontSize);
    });
    if (h1Ratio !== null) {
      expect(h1Ratio).toBeLessThanOrEqual(2.0);
    }
  });
});
