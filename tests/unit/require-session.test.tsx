import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireSession } from '../../src/app/RequireSession';
import { useSession } from '../../src/auth/useSession';

vi.mock('../../src/auth/useSession');
const mockedUseSession = vi.mocked(useSession);

function renderGuard(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>LOGIN SCREEN</div>} />
        <Route path="/" element={<RequireSession />}>
          <Route index element={<div>PROTECTED CONTENT</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireSession (contract auth-and-session.md §E)', () => {
  afterEach(() => {
    mockedUseSession.mockReset();
  });

  it('anonymous → redirige a /login sin montar el AppShell ni ninguna vista de área (E1; FR-001/008/010)', () => {
    mockedUseSession.mockReturnValue({ state: { status: 'anonymous' }, login: vi.fn(), logout: vi.fn() });
    renderGuard('/');
    expect(screen.getByText('LOGIN SCREEN')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED CONTENT')).toBeNull();
  });

  it('authenticated → renderiza el contenido protegido dentro del AppShell', () => {
    mockedUseSession.mockReturnValue({
      state: { status: 'authenticated', user: { username: 'alice', displayName: 'Alice' } },
      login: vi.fn(),
      logout: vi.fn(),
    });
    renderGuard('/');
    expect(screen.getByText('PROTECTED CONTENT')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN SCREEN')).toBeNull();
  });

  it('loading → marcador neutro mínimo, sin contenido de área y sin expulsar a /login (E1; FR-009)', () => {
    mockedUseSession.mockReturnValue({ state: { status: 'loading' }, login: vi.fn(), logout: vi.fn() });
    renderGuard('/');
    expect(screen.queryByText('LOGIN SCREEN')).toBeNull();
    expect(screen.queryByText('PROTECTED CONTENT')).toBeNull();
  });
});
