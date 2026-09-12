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

describe('HomeView (contract visual-system.md §3.7; FR-059; SC-030)', () => {
  beforeEach(() => {
    render(<HomeView areas={selectAreaList()} />);
  });

  it('muestra un encabezado de módulo "Inicio" (la identidad de producto vive en el AppShell persistente)', () => {
    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument();
  });

  it('explica el propósito con los cuatro conceptos obligatorios y "red e IoT"', () => {
    const body = document.body.textContent ?? '';
    expect(body).toContain('descubrimiento');
    expect(body).toContain('gestión');
    expect(body).toContain('diagnóstico');
    expect(body).toContain('observabilidad');
    expect(body).toContain('red e IoT');
  });

  it('lista las siete áreas exactamente una vez, en orden, cada una con su estado', () => {
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(7);
    items.forEach((li, i) => {
      expect(li).toHaveTextContent(AREA_LABELS[i]);
    });
  });

  it('muestra "Disponible" una vez (Inicio) y "No disponible" seis veces', () => {
    const items = screen.getAllByRole('listitem');
    const available = items.filter(
      (li) => li.textContent?.includes('Disponible') && !li.textContent.includes('No disponible'),
    );
    const unavailable = items.filter((li) => li.textContent?.includes('No disponible'));
    expect(available).toHaveLength(1);
    expect(unavailable).toHaveLength(6);
  });

  it('no renderiza nada que parezca un registro de dispositivo ni datos operacionales', () => {
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/); // IPv4
    expect(body).not.toMatch(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i); // MAC
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('no sustituye ni oculta la navegación principal (no renderiza su propio <nav>)', () => {
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('HomeView es presentacional (asignable a React.ComponentType)', () => {
  it('renderiza sin props (areas por defecto = [])', () => {
    render(<HomeView />);
    expect(screen.getAllByRole('heading', { level: 1, name: 'Inicio' }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
