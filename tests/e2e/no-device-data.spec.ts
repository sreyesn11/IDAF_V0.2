import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';
import { loginAs } from './_session';

const OPERATIONAL_ACTIONS = [
  /escanear red/i,
  /ejecutar diagn[oó]stico/i,
  /analizar dispositivo/i,
  /iniciar descubrimiento/i,
  /conectar/i,
  /a[ñn]adir dispositivo/i,
];

test.describe('Ninguna de las siete áreas muestra datos ni acciones de dispositivo (FR-043/044, con sesión)', () => {
  for (const area of AREAS) {
    test(`${area.label} — sin datos de dispositivo ni controles operativos`, async ({ page }) => {
      await loginAs(page);
      if (area.path !== '/') {
        await page.getByRole('link', { name: area.label, exact: true }).click();
      }
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const bodyText = (await page.locator('body').innerText()).toLowerCase();

      // Sin valores que representen instancias de dispositivos.
      expect(bodyText).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/); // IPv4
      expect(bodyText).not.toMatch(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i); // MAC
      expect(await page.getByRole('table').count()).toBe(0);

      // Sin controles que aparenten operar (más allá de "Cerrar sesión").
      const controls = await page.getByRole('button').all();
      for (const control of controls) {
        const text = (await control.innerText()).trim();
        for (const forbidden of OPERATIONAL_ACTIONS) {
          expect(text).not.toMatch(forbidden);
        }
      }
      // Las áreas pendientes no tienen ningún control interactivo propio de módulo.
      if (area.path !== '/') {
        expect(await page.locator('main input, main select, main form, main button').count()).toBe(0);
      }
    });
  }
});
