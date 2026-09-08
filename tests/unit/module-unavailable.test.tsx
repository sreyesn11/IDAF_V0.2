import { render, screen, within } from '@testing-library/react';
import { InventoryView } from '../../src/modules/inventory/InventoryView';
import { DiscoveryView } from '../../src/modules/discovery/DiscoveryView';
import { ConnectionsView } from '../../src/modules/connections/ConnectionsView';
import { DiagnosticsView } from '../../src/modules/diagnostics/DiagnosticsView';
import { TopologyView } from '../../src/modules/topology/TopologyView';
import { ObservabilityView } from '../../src/modules/observability/ObservabilityView';

const PENDING_MODULES = [
  { label: 'Inventario', View: InventoryView },
  { label: 'Descubrimiento', View: DiscoveryView },
  { label: 'Conexiones', View: ConnectionsView },
  { label: 'Diagnósticos', View: DiagnosticsView },
  { label: 'Topología', View: TopologyView },
  { label: 'Observabilidad', View: ObservabilityView },
];

describe('Vistas de módulo no disponible (FR-015..FR-018, SC-004, US3)', () => {
  for (const { label, View } of PENDING_MODULES) {
    describe(label, () => {
      it('has a heading containing the module label', () => {
        render(<View />);
        expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
      });

      it('states explicitly that the functionality is pending and will be added later', () => {
        render(<View />);
        const text = document.body.textContent ?? '';
        expect(text).toMatch(/todavía no está disponible/i);
        expect(text).toMatch(/versión posterior de IDAF/i);
      });

      it('exposes no actionable control (FR-017)', () => {
        const { container } = render(<View />);
        expect(screen.queryAllByRole('button')).toHaveLength(0);
        expect(container.querySelector('input')).toBeNull();
        expect(container.querySelector('form')).toBeNull();
        expect(container.querySelector('select')).toBeNull();
        expect(container.querySelector('[role="button"]')).toBeNull();
        expect(container.querySelector('a')).toBeNull();
      });

      it('is not empty and shows no internal technical text (FR-018)', () => {
        const { container } = render(<View />);
        const region = container.querySelector('section') ?? container;
        expect((within(region as HTMLElement).getByRole('heading').textContent ?? '').length).toBeGreaterThan(0);
        const text = document.body.textContent ?? '';
        expect(text.trim().length).toBeGreaterThan(20);
        expect(text).not.toMatch(/error|exception|stack|traceback|\.tsx?\b|undefined|null/i);
      });
    });
  }
});
