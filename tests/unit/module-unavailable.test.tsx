import { render, screen } from '@testing-library/react';
import { ModuleUnavailable } from '../../src/components/ModuleUnavailable';
import { idaf } from '../../src/content/idaf';

describe('ModuleUnavailable (contract visual-system.md §3.6; FR-043/044; SC-014)', () => {
  it('renderiza ModuleHeader + icono del módulo + StatusBadge "No disponible" + explicación', () => {
    const { container } = render(<ModuleUnavailable areaLabel="Inventario" icon="inventory" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Inventario' })).toBeInTheDocument();
    expect(screen.getByText(idaf.statusText.unavailable)).toBeInTheDocument();
    expect(screen.getByText(idaf.unavailableBody)).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('prohíbe cualquier elemento interactivo o de datos (FR-043/044)', () => {
    const { container } = render(<ModuleUnavailable areaLabel="Inventario" icon="inventory" />);
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('form')).toBeNull();
    expect(container.querySelector('select')).toBeNull();
    expect(container.querySelector('[role="button"]')).toBeNull();
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
  });

  it('no muestra valores que parezcan métricas ni datos de dispositivo', () => {
    render(<ModuleUnavailable areaLabel="Diagnósticos" icon="diagnostics" />);
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/); // IPv4
    expect(text).not.toMatch(/\d+\s?(ms|Mbps|%|dispositivos)\b/i);
  });

  it('conserva la explicación explícita de incorporación futura (idéntica en todas las áreas)', () => {
    render(<ModuleUnavailable areaLabel="Topología" icon="topology" />);
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/todavía no está disponible/i);
    expect(text).toMatch(/versión posterior de IDAF/i);
  });
});
