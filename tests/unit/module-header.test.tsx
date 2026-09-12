import { render, screen } from '@testing-library/react';
import { ModuleHeader } from '../../src/components/ModuleHeader';

describe('ModuleHeader (contract visual-system.md §3.2; FR-031/032/033)', () => {
  it('renderiza <h1 tabIndex={-1}> con el título', () => {
    render(<ModuleHeader title="Inventario" />);
    const heading = screen.getByRole('heading', { level: 1, name: 'Inventario' });
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('renderiza la descripción opcional como <p>', () => {
    render(<ModuleHeader title="Inventario" description="Catálogo de dispositivos" />);
    expect(screen.getByText('Catálogo de dispositivos').tagName).toBe('P');
  });

  it('sin descripción, no renderiza el párrafo de descripción', () => {
    const { container } = render(<ModuleHeader title="Inventario" />);
    expect(container.querySelector('.module-header__description')).toBeNull();
  });

  it('usa el mismo marcado/clases para distintas áreas (consistencia — FR-036)', () => {
    const { container: a } = render(<ModuleHeader title="Inicio" description="x" />);
    const { container: b } = render(<ModuleHeader title="Topología" description="y" />);
    expect(a.querySelector('.module-header h1')).not.toBeNull();
    expect(b.querySelector('.module-header h1')).not.toBeNull();
    expect(a.querySelector('.module-header__description')).not.toBeNull();
    expect(b.querySelector('.module-header__description')).not.toBeNull();
  });
});
