import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from '../../src/auth/SessionProvider';
import { useSession } from '../../src/auth/useSession';
import { authClient } from '../../src/auth/authClient';
import { setDocumentVisibility } from '../setup';

vi.mock('../../src/auth/authClient', () => ({
  authClient: {
    login: vi.fn(),
    fetchSession: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedAuthClient = vi.mocked(authClient);

function Probe() {
  const { state, login, logout } = useSession();
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      {state.status === 'authenticated' ? <span data-testid="name">{state.user.displayName}</span> : null}
      <button onClick={() => void login('alice', 'secret')}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
}

describe('SessionProvider (contract auth-and-session.md §D)', () => {
  beforeEach(() => {
    mockedAuthClient.login.mockReset();
    mockedAuthClient.fetchSession.mockReset();
    mockedAuthClient.logout.mockReset();
  });

  it('sin marcador en sessionStorage → anonymous inmediatamente, sin llamar a fetchSession (D1)', () => {
    renderProvider();
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    expect(mockedAuthClient.fetchSession).not.toHaveBeenCalled();
  });

  it('login() válido escribe SOLO {username,displayName} en sessionStorage y pasa a authenticated (D2)', async () => {
    mockedAuthClient.login.mockResolvedValue({ ok: true, user: { username: 'alice', displayName: 'Alice' } });
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('name')).toHaveTextContent('Alice');
    expect(JSON.parse(window.sessionStorage.getItem('idaf.session') ?? '{}')).toEqual({
      username: 'alice',
      displayName: 'Alice',
    });
  });

  it('login() fallido no toca sessionStorage ni cambia el estado (D2)', async () => {
    mockedAuthClient.login.mockResolvedValue({ ok: false, reason: 'invalid_credentials' });
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByText('login'));

    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    expect(window.sessionStorage.getItem('idaf.session')).toBeNull();
  });

  it('logout() invoca authClient.logout(), borra el marcador y pasa a anonymous (D3)', async () => {
    mockedAuthClient.login.mockResolvedValue({ ok: true, user: { username: 'alice', displayName: 'Alice' } });
    mockedAuthClient.logout.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await user.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(window.sessionStorage.getItem('idaf.session')).toBeNull();
    expect(mockedAuthClient.logout).toHaveBeenCalled();
  });

  it('con marcador presente al montar, rehidrata vía fetchSession() → authenticated con la identidad del servicio (D1)', async () => {
    window.sessionStorage.setItem('idaf.session', JSON.stringify({ username: 'alice', displayName: 'Alice viejo' }));
    mockedAuthClient.fetchSession.mockResolvedValue({
      authenticated: true,
      user: { username: 'alice', displayName: 'Alice del servicio' },
    });
    renderProvider();

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('name')).toHaveTextContent('Alice del servicio');
  });

  it('con marcador presente pero el servicio responde authenticated:false → borra marcador, anonymous (D1)', async () => {
    window.sessionStorage.setItem('idaf.session', JSON.stringify({ username: 'alice', displayName: 'Alice' }));
    mockedAuthClient.fetchSession.mockResolvedValue({ authenticated: false });
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(window.sessionStorage.getItem('idaf.session')).toBeNull();
  });

  it('con marcador presente y fetchSession() rechazada (error de red) → anonymous (D1)', async () => {
    window.sessionStorage.setItem('idaf.session', JSON.stringify({ username: 'alice', displayName: 'Alice' }));
    mockedAuthClient.fetchSession.mockRejectedValue(new Error('network'));
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
  });

  it('revalida en visibilitychange mientras hay sesión activa; authenticated:false → anonymous (D8; FR-058)', async () => {
    mockedAuthClient.login.mockResolvedValue({ ok: true, user: { username: 'alice', displayName: 'Alice' } });
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    mockedAuthClient.fetchSession.mockResolvedValue({ authenticated: false });
    act(() => {
      setDocumentVisibility('visible');
    });

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
  });

  it('un error de red durante la revalidación en foco NO cierra la sesión (D8)', async () => {
    mockedAuthClient.login.mockResolvedValue({ ok: true, user: { username: 'alice', displayName: 'Alice' } });
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    mockedAuthClient.fetchSession.mockRejectedValue(new Error('network blip'));
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
  });
});
