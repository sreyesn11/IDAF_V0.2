import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginView } from '../../src/modules/login/LoginView';
import { useSession } from '../../src/auth/useSession';
import { idaf } from '../../src/content/idaf';

vi.mock('../../src/auth/useSession');
const mockedUseSession = vi.mocked(useSession);

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginView />
    </MemoryRouter>,
  );
}

describe('LoginView (contract auth-and-session.md §F)', () => {
  const login = vi.fn();
  const logout = vi.fn();

  beforeEach(() => {
    login.mockReset();
    logout.mockReset();
    mockedUseSession.mockReturnValue({ state: { status: 'anonymous' }, login, logout });
  });

  it('muestra el nombre IDAF, el propósito, los campos y la acción de enviar (F1)', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: 'IDAF' })).toBeInTheDocument();
    expect(screen.getByText(idaf.purpose)).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('el foco está en el campo Usuario al montar (F1/D5)', () => {
    renderLogin();
    expect(screen.getByLabelText('Usuario')).toHaveFocus();
  });

  it('campos vacíos → indicación de campo requerido, SIN llamar a login() (F2; FR-006)', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(login).not.toHaveBeenCalled();
    expect(screen.getAllByText(idaf.auth.requiredField).length).toBeGreaterThan(0);
  });

  it('credenciales inválidas → un mensaje genérico, en role="alert", con el foco (F4; FR-004/005)', async () => {
    login.mockResolvedValue({ ok: false, reason: 'invalid_credentials' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Usuario'), 'alice');
    await user.type(screen.getByLabelText('Contraseña'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(idaf.auth.invalidCredentials);
    await waitFor(() => expect(alert).toHaveFocus());
  });

  it('verificación no disponible → mensaje DISTINTO del de credenciales inválidas (F4; FR-056)', async () => {
    login.mockResolvedValue({ ok: false, reason: 'unavailable' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Usuario'), 'alice');
    await user.type(screen.getByLabelText('Contraseña'), 'whatever');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(idaf.auth.unavailable);
    expect(alert.textContent).not.toBe(idaf.auth.invalidCredentials);
  });

  it('recorta ("trim") el usuario antes de llamar a login() (data-model.md §1)', async () => {
    login.mockResolvedValue({ ok: false, reason: 'invalid_credentials' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Usuario'), '  alice  ');
    await user.type(screen.getByLabelText('Contraseña'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('alice', 'secret'));
  });

  it('alterna mostrar/ocultar contraseña (F1)', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: idaf.auth.showPassword }));
    expect(passwordInput).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: idaf.auth.hidePassword }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('mientras login() está pendiente, el botón se deshabilita y no aparenta disponible (F9; FR-041)', async () => {
    let resolveLogin!: (value: { ok: false; reason: 'invalid_credentials' }) => void;
    login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Usuario'), 'alice');
    await user.type(screen.getByLabelText('Contraseña'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    const button = screen.getByRole('button', { name: 'Iniciar sesión' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    resolveLogin({ ok: false, reason: 'invalid_credentials' });
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('con sesión ya activa, no renderiza el formulario (F10; FR-057)', () => {
    mockedUseSession.mockReturnValue({
      state: { status: 'authenticated', user: { username: 'alice', displayName: 'Alice' } },
      login,
      logout,
    });
    renderLogin();
    expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).toBeNull();
  });
});
