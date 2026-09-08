import { render } from '@testing-library/react';
import { createElement } from 'react';
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

describe('MODULE_REGISTRY invariants (contract R1–R7)', () => {
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
});

describe('selectAreaList()', () => {
  it('returns seven {label,statusText} rows in order', () => {
    const rows = selectAreaList();
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.label)).toEqual(FR006_LABELS);
  });

  it('labels "Disponible" only for Inicio and "No disponible" for the other six', () => {
    const rows = selectAreaList();
    expect(rows[0]).toEqual({ label: 'Inicio', statusText: 'Disponible' });
    const rest = rows.slice(1);
    expect(rest).toHaveLength(6);
    for (const row of rest) {
      expect(row.statusText).toBe('No disponible');
    }
  });
});

describe('unavailable entries render an inert ModuleUnavailable view', () => {
  for (const area of MODULE_REGISTRY.filter((a) => a.status === 'unavailable')) {
    it(`${area.id} renders its label heading and no button/input`, () => {
      const { container, getByRole, unmount } = render(createElement(area.Component));
      expect(getByRole('heading', { name: area.label })).toBeInTheDocument();
      expect(container.querySelector('button')).toBeNull();
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('form')).toBeNull();
      expect(container.querySelector('[role="button"]')).toBeNull();
      unmount();
    });
  }
});
