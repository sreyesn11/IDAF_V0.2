import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PrimaryNav } from '../../src/components/PrimaryNav';
import { idaf } from '../../src/content/idaf';
import { MODULE_REGISTRY, selectAreaList } from '../../src/modules/registry';

const FR006_LABELS = [
  'Inicio',
  'Inventario',
  'Descubrimiento',
  'Conexiones',
  'Diagnósticos',
  'Topología',
  'Observabilidad',
];

function renderNav(initialPath: string) {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <PrimaryNav />
    </MemoryRouter>,
  );
}

describe('PrimaryNav (contract navigation-and-routes.md §3; FR-018..026)', () => {
  it('renderiza exactamente 7 enlaces, cada uno con icono + nombre visible, en el orden de FR-006', () => {
    renderNav('/');
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(7);
    expect(links.map((a) => a.textContent)).toEqual(FR006_LABELS);
    for (const link of links) {
      expect(link.querySelector('svg')).not.toBeNull();
      expect(link.querySelector('.primary-nav__label')?.textContent?.length).toBeGreaterThan(0);
    }
  });

  it('usa las mismas etiquetas que selectAreaList() (fuente única — FR-025)', () => {
    renderNav('/');
    const navLabels = screen.getAllByRole('link').map((a) => a.textContent);
    expect(navLabels).toEqual(selectAreaList().map((r) => r.label));
  });

  it('los 7 iconos son 7 valores distintos de la misma familia (N3; FR-020)', () => {
    const icons = MODULE_REGISTRY.map((a) => a.icon);
    expect(new Set(icons).size).toBe(7);
  });

  it('combinación (label, icon) única por área, sin entradas duplicadas (SC-038)', () => {
    const combos = MODULE_REGISTRY.map((a) => `${a.label}::${a.icon}`);
    expect(new Set(combos).size).toBe(7);
  });

  it('el icono es aria-hidden y NUNCA sustituye al nombre accesible (FR-018/024)', () => {
    renderNav('/');
    for (const label of FR006_LABELS) {
      const link = screen.getByRole('link', { name: label });
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('con el icono oculto, el nombre visible sigue identificando cada entrada (SC-012; CL-07)', () => {
    renderNav('/');
    for (const link of screen.getAllByRole('link')) {
      link.querySelector('svg')?.setAttribute('style', 'display:none');
    }
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(FR006_LABELS);
  });

  it('marca exactamente una entrada activa con aria-current="page" para la ruta actual', () => {
    renderNav('/topologia');
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe('Topología');
    expect(current[0]).toHaveClass('is-active');
  });

  it('Inicio está activo sólo en "/" (end match, no por prefijo)', () => {
    renderNav('/');
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe('Inicio');
  });

  it('PrimaryNav.css codifica ≥2 señales no cromáticas para .is-active (SC-031; FR-021)', () => {
    const css = readFileSync(path.resolve(__dirname, '../../src/components/PrimaryNav.css'), 'utf8');
    const activeRule = css.match(/\.primary-nav__link\.is-active\s*\{([^}]+)\}/)?.[1] ?? '';
    // Forma (borde de acento) + peso tipográfico: ambas no cromáticas y
    // perceptibles en simulación de acromatopsia.
    expect(activeRule).toMatch(/border-left-color/);
    expect(activeRule).toMatch(/font-weight/);
  });

  it('el nombre accesible de cada entrada coincide con su etiqueta visible', () => {
    renderNav('/');
    for (const label of FR006_LABELS) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('la navegación expone el landmark aria-label={idaf.navAriaLabel} (N7)', () => {
    renderNav('/');
    expect(screen.getByRole('navigation', { name: idaf.navAriaLabel })).toBeInTheDocument();
  });

  it('alcanza las 7 entradas por Tab en el orden de FR-006', async () => {
    const user = userEvent.setup();
    renderNav('/');
    const links = screen.getAllByRole('link');
    for (const link of links) {
      await user.tab();
      expect(link).toHaveFocus();
    }
  });
});
