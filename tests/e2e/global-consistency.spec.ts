import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AREAS } from './_areas';
import { loginAs } from './_session';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, '../../src');

function collectCssFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectCssFiles(full));
    } else if (entry.endsWith('.css') && entry !== 'tokens.css') {
      files.push(full);
    }
  }
  return files;
}

/**
 * Pasada final de consistencia (Polish, T089): sucesora de
 * `structure-consistency.spec.ts` (US5, Inicio + shell) y
 * `unavailable-modules.spec.ts` (US6, las 6 vistas «No disponible»). Cubre
 * las 7 áreas + Login con el juicio de divergencia global = 0 (FR-036;
 * SC-019) y el barrido runtime SC-032/033/034/035.
 */
test.describe('Consistencia global — FR-036 / SC-019 (divergencia = 0 sobre 7×9 pares)', () => {
  test('ningún archivo de componente (fuera de tokens.css) declara un color hexadecimal literal', () => {
    const cssFiles = collectCssFiles(path.join(SRC_ROOT, 'components'))
      .concat(collectCssFiles(path.join(SRC_ROOT, 'app')))
      .concat(collectCssFiles(path.join(SRC_ROOT, 'modules')))
      .concat([path.join(SRC_ROOT, 'styles/base.css')]);

    const hexColor = /#[0-9a-f]{3,8}\b/i;
    for (const file of cssFiles) {
      const content = readFileSync(file, 'utf8');
      expect(hexColor.test(content), `color hexadecimal literal en ${path.relative(SRC_ROOT, file)}`).toBe(false);
    }
  });

  test('las 7 áreas usan el mismo <h1> de ModuleHeader (mismo tamaño de fuente computado)', async ({ page }) => {
    await loginAs(page);
    const sizes = new Set<string>();
    for (const area of AREAS) {
      if (area.path !== '/') {
        await page.getByRole('link', { name: area.label, exact: true }).click();
      }
      const size = await page.evaluate(() => getComputedStyle(document.querySelector('main h1')!).fontSize);
      sizes.add(size);
    }
    expect(sizes.size).toBe(1);
  });

  test('las 7 áreas mantienen las 4 zonas del shell sin divergencia estructural', async ({ page }) => {
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
});

test.describe('Barrido runtime SC-032/033/034/035 — las 7 áreas + Login', () => {
  test('Login: sin gráficos decorativos, line-height ≥1.4, h1 ≤2× cuerpo', async ({ page }) => {
    await page.goto('/login');
    await assertVisualCriteria(page, '.login-view');
  });

  for (const area of AREAS) {
    test(`${area.label}: sin gráficos decorativos, line-height ≥1.4, h1 ≤2× cuerpo`, async ({ page }) => {
      await loginAs(page);
      if (area.path !== '/') {
        await page.getByRole('link', { name: area.label, exact: true }).click();
      }
      await assertVisualCriteria(page, 'main');
    });
  }
});

async function assertVisualCriteria(page: import('@playwright/test').Page, scope: string): Promise<void> {
  expect(await page.locator(`${scope} img`).count()).toBe(0);
  expect(await page.locator(`${scope} canvas`).count()).toBe(0);

  const result = await page.evaluate((selector) => {
    const root = document.querySelector(selector)!;
    const h1 = root.querySelector('h1');
    const p = root.querySelector('p');
    const bodyFontSize = parseFloat(getComputedStyle(document.body).fontSize);
    return {
      h1Ratio: h1 ? parseFloat(getComputedStyle(h1).fontSize) / bodyFontSize : null,
      pLineHeightRatio: p
        ? parseFloat(getComputedStyle(p).lineHeight) / parseFloat(getComputedStyle(p).fontSize)
        : null,
    };
  }, scope);

  if (result.h1Ratio !== null) expect(result.h1Ratio).toBeLessThanOrEqual(2.0);
  if (result.pLineHeightRatio !== null) expect(result.pLineHeightRatio).toBeGreaterThanOrEqual(1.4);
}
