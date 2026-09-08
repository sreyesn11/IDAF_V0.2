import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';

const OPERATIONAL_ACTIONS = [
  /escanear red/i,
  /ejecutar diagn[oó]stico/i,
  /analizar dispositivo/i,
  /iniciar descubrimiento/i,
  /conectar/i,
  /a[ñn]adir dispositivo/i,
];

test.describe('Ninguna de las siete áreas muestra datos ni acciones de dispositivo (FR-017/019/026)', () => {
  for (const area of AREAS) {
    test(`${area.label} — sin datos de dispositivo ni controles operativos`, async ({ page }) => {
      await page.goto(area.path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const bodyText = (await page.locator('body').innerText()).toLowerCase();

      // Sin valores que representen instancias de dispositivos.
      expect(bodyText).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/); // IPv4
      expect(bodyText).not.toMatch(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i); // MAC
      expect(await page.getByRole('table').count()).toBe(0);

      // Sin controles que aparenten operar.
      const controls = await page.getByRole('button').all();
      for (const control of controls) {
        const text = (await control.innerText()).trim();
        for (const forbidden of OPERATIONAL_ACTIONS) {
          expect(text).not.toMatch(forbidden);
        }
      }
      // Las áreas pendientes no tienen ningún control interactivo.
      if (area.path !== '/') {
        expect(await page.getByRole('button').count()).toBe(0);
        expect(await page.locator('main input, main select, main form').count()).toBe(0);
      }
    });
  }
});
