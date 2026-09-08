import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PrimaryNav } from '../../src/components/PrimaryNav';
import { idaf } from '../../src/content/idaf';
import { selectAreaList } from '../../src/modules/registry';

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

describe('PrimaryNav (FR-006..FR-009, FR-025, FR-028..FR-030)', () => {
  it('renders exactly seven links whose labels are the idaf.areaLabels in FR-006 order', () => {
    renderNav('/');
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(7);
    expect(links.map((a) => a.textContent)).toEqual(FR006_LABELS);
    expect(FR006_LABELS).toEqual(
      ['home', 'inventory', 'discovery', 'connections', 'diagnostics', 'topology', 'observability'].map(
        (id) => idaf.areaLabels[id as keyof typeof idaf.areaLabels],
      ),
    );
  });

  it('uses the same label strings as selectAreaList() rows (one source)', () => {
    renderNav('/');
    const navLabels = screen.getAllByRole('link').map((a) => a.textContent);
    expect(navLabels).toEqual(selectAreaList().map((r) => r.label));
  });

  it('each link accessible name equals its visible label', () => {
    renderNav('/');
    for (const label of FR006_LABELS) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('marks exactly one link active with aria-current="page" for the current route', () => {
    renderNav('/topologia');
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe('Topología');
    expect(current[0]).toHaveClass('is-active');
  });

  it('marks Inicio active only on "/" (end match, not a prefix)', () => {
    renderNav('/');
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe('Inicio');
  });

  it('reaches each of the seven links by Tab in FR-006 order', async () => {
    const user = userEvent.setup();
    renderNav('/');
    const links = screen.getAllByRole('link');
    for (const link of links) {
      await user.tab();
      expect(link).toHaveFocus();
    }
  });
});
