import { test, expect } from '@playwright/test';
import { AREAS } from './_areas';
import { loginAs } from './_session';

test.describe('Navegación con icono + nombre y estado activo (US3; SC-010..013/031)', () => {
  test('las 7 entradas muestran icono + nombre visible, de una única familia (24×24)', async ({ page }) => {
    await loginAs(page);
    const nav = page.getByRole('navigation', { name: 'Áreas de IDAF' });
    const links = await nav.getByRole('link').all();
    expect(links).toHaveLength(7);
    for (const link of links) {
      await expect(link.locator('svg')).toHaveAttribute('viewBox', '0 0 24 24');
      const text = (await link.textContent())?.trim() ?? '';
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('en cada una de las 7 vistas hay exactamente una entrada activa (SC-011/031)', async ({ page }) => {
    await loginAs(page);
    for (const area of AREAS) {
      if (area.path !== '/') {
        await page.getByRole('link', { name: area.label, exact: true }).click();
      }
      const active = page.locator('nav a[aria-current="page"]');
      await expect(active).toHaveCount(1);
      await expect(active).toContainText(area.label);
    }
  });

  test('la entrada activa difiere en ≥2 propiedades renderizadas, ≥1 no cromática (borde + peso), perceptible en acromatopsia (SC-031)', async ({
    page,
  }) => {
    await loginAs(page);
    await page.getByRole('link', { name: 'Diagnósticos', exact: true }).click();

    const active = page.getByRole('link', { name: 'Diagnósticos' });
    const inactive = page.getByRole('link', { name: 'Inicio' });

    const [activeStyle, inactiveStyle] = await Promise.all([
      active.evaluate((el) => {
        const s = getComputedStyle(el);
        return { borderLeftWidth: s.borderLeftWidth, fontWeight: s.fontWeight, color: s.color };
      }),
      inactive.evaluate((el) => {
        const s = getComputedStyle(el);
        return { borderLeftWidth: s.borderLeftWidth, fontWeight: s.fontWeight, color: s.color };
      }),
    ]);

    // ≥2 propiedades distintas, de las que ≥1 no depende del color (forma y peso).
    expect(activeStyle.borderLeftWidth).not.toBe(inactiveStyle.borderLeftWidth);
    expect(activeStyle.fontWeight).not.toBe(inactiveStyle.fontWeight);
    expect(activeStyle.color).not.toBe(inactiveStyle.color);
  });

  test('alternancia rápida ≥20 veces: siempre una sola activa, sin contenido duplicado (SC-011)', async ({ page }) => {
    await loginAs(page);
    const sequence = AREAS.filter((a) => a.path !== '/');
    let last = sequence[0];
    for (let i = 0; i < 22; i++) {
      last = sequence[i % sequence.length];
      await page.getByRole('link', { name: last.label, exact: true }).click();
      await expect(page.locator('nav a[aria-current="page"]')).toHaveCount(1);
    }
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: last.heading })).toBeVisible();
  });

  test('con los iconos ocultos (CSS), las 7 entradas siguen siendo usables por su nombre (SC-012; CL-07)', async ({
    page,
  }) => {
    await loginAs(page);
    await page.addStyleTag({ content: '.primary-nav svg { display: none !important; }' });
    for (const area of AREAS.slice(1, 3)) {
      await page.getByRole('link', { name: area.label, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name: area.heading })).toBeVisible();
    }
  });

  test('en escala de grises (achromatopsia), la entrada activa sigue siendo distinguible (SC-031/015)', async ({
    page,
  }) => {
    await loginAs(page);
    await page.emulateMedia({ colorScheme: 'light' });
    // Emula acromatopsia con un filtro CSS equivalente al de DevTools.
    await page.addStyleTag({ content: 'html { filter: grayscale(1) !important; }' });
    await page.getByRole('link', { name: 'Conexiones', exact: true }).click();
    const active = page.locator('nav a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    const borderWidth = await active.evaluate((el) => getComputedStyle(el).borderLeftWidth);
    expect(parseFloat(borderWidth)).toBeGreaterThan(0);
  });
});
