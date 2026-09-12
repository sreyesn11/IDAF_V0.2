import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SessionBar } from '../../src/components/SessionBar';
import { useSession } from '../../src/auth/useSession';
import { idaf } from '../../src/content/idaf';

vi.mock('../../src/auth/useSession');
const mockedUseSession = vi.mocked(useSession);

function renderBar() {
  return render(
    <MemoryRouter>
      <SessionBar />
    </MemoryRouter>,
  );
}

describe('SessionBar (contract visual-system.md §3.3; FR-011/012/015/045)', () => {
  const logout = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    logout.mockClear();
    mockedUseSession.mockReturnValue({
      state: { status: 'authenticated', user: { username: 'alice', displayName: 'Alice Operadora' } },
      login: vi.fn(),
      logout,
    });
  });

  it('muestra la identidad del usuario y "Cerrar sesión" agrupadas en una región "Sesión" (FR-011/012/015)', () => {
    renderBar();
    const region = screen.getByLabelText(idaf.session.regionLabel);
    expect(region).toHaveTextContent('Alice Operadora');
    expect(screen.getByRole('button', { name: idaf.session.logout })).toBeInTheDocument();
  });

  it('"Cerrar sesión" es un <button>, no un enlace de módulo', () => {
    renderBar();
    const button = screen.getByRole('button', { name: idaf.session.logout });
    expect(button.tagName).toBe('BUTTON');
  });

  it('activar "Cerrar sesión" invoca logout()', async () => {
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole('button', { name: idaf.session.logout }));
    expect(logout).toHaveBeenCalled();
  });

  it('un displayName largo se trunca visualmente pero conserva el valor completo en title (FR-045; SC-020)', () => {
    const longName = 'Responsable de Infraestructura de Red, Conectividad e IoT';
    mockedUseSession.mockReturnValue({
      state: { status: 'authenticated', user: { username: 'admin', displayName: longName } },
      login: vi.fn(),
      logout,
    });
    renderBar();
    expect(screen.getByTitle(longName)).toBeInTheDocument();
  });

  it('sin sesión activa, no renderiza nada', () => {
    mockedUseSession.mockReturnValue({ state: { status: 'anonymous' }, login: vi.fn(), logout });
    const { container } = renderBar();
    expect(container).toBeEmptyDOMElement();
  });
});
