import { render, screen } from '@testing-library/react';
import { HomeView } from '../../src/modules/home/HomeView';
import { selectAreaList } from '../../src/modules/registry';

const AREA_LABELS = [
  'Inicio',
  'Inventario',
  'Descubrimiento',
  'Conexiones',
  'Diagnósticos',
  'Topología',
  'Observabilidad',
];

describe('HomeView (FR-001..FR-005, FR-019)', () => {
  beforeEach(() => {
    render(<HomeView areas={selectAreaList()} />);
  });

  it('shows the product name IDAF', () => {
    expect(screen.getByRole('heading', { name: 'IDAF' })).toBeInTheDocument();
  });

  it('explains the purpose with the four mandatory concepts and "red e IoT"', () => {
    const body = document.body.textContent ?? '';
    expect(body).toContain('descubrimiento');
    expect(body).toContain('gestión');
    expect(body).toContain('diagnóstico');
    expect(body).toContain('observabilidad');
    expect(body).toContain('red e IoT');
  });

  it('lists the seven areas exactly once, in order, each with a status label', () => {
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(7);

    items.forEach((li, i) => {
      const spans = Array.from(li.querySelectorAll('span'));
      expect(spans[0].textContent).toBe(AREA_LABELS[i]);
      expect(['Disponible', 'No disponible']).toContain(spans[1].textContent);
    });
  });

  it('shows "Disponible" once (Inicio) and "No disponible" six times', () => {
    const items = screen.getAllByRole('listitem');
    const statuses = items.map((li) => li.querySelectorAll('span')[1].textContent);
    expect(statuses.filter((s) => s === 'Disponible')).toHaveLength(1);
    expect(statuses.filter((s) => s === 'No disponible')).toHaveLength(6);
    expect(items[0].querySelectorAll('span')[1].textContent).toBe('Disponible');
  });

  it('renders nothing that resembles a device record', () => {
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/); // IPv4
    expect(body).not.toMatch(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i); // MAC
    expect(screen.queryByRole('table')).toBeNull();
  });
});

describe('HomeView is presentational (assignable to React.ComponentType)', () => {
  it('renders with no props (areas defaults to [])', () => {
    render(<HomeView />);
    expect(screen.getAllByRole('heading', { name: 'IDAF' }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
