import { render } from '@testing-library/react';
import { createElement } from 'react';
import { ICON_PATHS } from '../../src/components/icons/paths';
import { idaf } from '../../src/content/idaf';
import { MODULE_REGISTRY, selectAreaList } from '../../src/modules/registry';

const FR006_ORDER = [
  'home',
  'inventory',
  'discovery',
  'connections',
  'diagnostics',
  'topology',
  'observability',
] as const;

const FR006_LABELS = [
  'Inicio',
  'Inventario',
  'Descubrimiento',
  'Conexiones',
  'Diagnósticos',
  'Topología',
  'Observabilidad',
];

describe('MODULE_REGISTRY invariants (contract R1–R7; data-model §5)', () => {
  it('has exactly seven entries', () => {
    expect(MODULE_REGISTRY).toHaveLength(7);
  });

  it('orders entries 1..7 with no gaps or repeats, in FR-006 sequence', () => {
    const byOrder = [...MODULE_REGISTRY].sort((a, b) => a.order - b.order);
    expect(byOrder.map((a) => a.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(byOrder.map((a) => a.id)).toEqual([...FR006_ORDER]);
  });

  it('has unique id, path and label across entries', () => {
    const ids = MODULE_REGISTRY.map((a) => a.id);
    const paths = MODULE_REGISTRY.map((a) => a.path);
    const labels = MODULE_REGISTRY.map((a) => a.label);
    expect(new Set(ids).size).toBe(7);
    expect(new Set(paths).size).toBe(7);
    expect(new Set(labels).size).toBe(7);
  });

  it('takes every label from idaf.areaLabels (single source)', () => {
    for (const area of MODULE_REGISTRY) {
      expect(area.label).toBe(idaf.areaLabels[area.id]);
    }
    expect([...MODULE_REGISTRY].sort((a, b) => a.order - b.order).map((a) => a.label)).toEqual(
      FR006_LABELS,
    );
  });

  it('marks exactly one entry available and it is home', () => {
    const available = MODULE_REGISTRY.filter((a) => a.status === 'available');
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe('home');
  });

  it('home path is "/" and every other path is a distinct slug', () => {
    const home = MODULE_REGISTRY.find((a) => a.id === 'home');
    expect(home?.path).toBe('/');
    for (const area of MODULE_REGISTRY.filter((a) => a.id !== 'home')) {
      expect(area.path.startsWith('/')).toBe(true);
      expect(area.path).not.toBe('/');
    }
  });

  it('every entry has an icon that exists in the icon map (FR-019/020)', () => {
    for (const area of MODULE_REGISTRY) {
      expect(Object.keys(ICON_PATHS)).toContain(area.icon);
    }
  });

  it('the seven icons are seven distinct values (FR-020; SC-013)', () => {
    const icons = MODULE_REGISTRY.map((a) => a.icon);
    expect(new Set(icons).size).toBe(7);
  });

  it('each area has a unique (label, icon) combination — no duplicate nav entries (FR-025; SC-038)', () => {
    const combos = MODULE_REGISTRY.map((a) => `${a.label}::${a.icon}`);
    expect(new Set(combos).size).toBe(7);
  });

  it('every entry has a non-empty description sourced from idaf.areaDescriptions (FR-033)', () => {
    for (const area of MODULE_REGISTRY) {
      expect(area.description).toBe(idaf.areaDescriptions[area.id]);
      expect(area.description?.length).toBeGreaterThan(0);
    }
  });
});

describe('selectAreaList()', () => {
  it('returns seven {label,statusText,available} rows in order', () => {
    const rows = selectAreaList();
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.label)).toEqual(FR006_LABELS);
  });

  it('labels "Disponible" only for Inicio and "No disponible" for the other six', () => {
    const rows = selectAreaList();
    expect(rows[0]).toEqual({ label: 'Inicio', statusText: 'Disponible', available: true });
    const rest = rows.slice(1);
    expect(rest).toHaveLength(6);
    for (const row of rest) {
      expect(row.statusText).toBe('No disponible');
      expect(row.available).toBe(false);
    }
  });
});

describe('unavailable entries render an inert ModuleUnavailable view', () => {
  for (const area of MODULE_REGISTRY.filter((a) => a.status === 'unavailable')) {
    it(`${area.id} renders its label heading, its icon, and no button/input`, () => {
      const { container, getByRole, unmount } = render(createElement(area.Component));
      expect(getByRole('heading', { name: area.label })).toBeInTheDocument();
      expect(container.querySelector('svg')).not.toBeNull();
      expect(container.querySelector('button')).toBeNull();
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('form')).toBeNull();
      expect(container.querySelector('[role="button"]')).toBeNull();
      unmount();
    });
  }
});
