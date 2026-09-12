import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '../../components/Brand';
import { Icon } from '../../components/icons';
import { idaf } from '../../content/idaf';
import { useSession } from '../../auth/useSession';
import './LoginView.css';

interface FieldErrors {
  username?: boolean;
  password?: boolean;
}

/**
 * Pantalla de acceso (contract auth-and-session.md §F). Contenido mínimo:
 * `Brand` + propósito + Usuario + Contraseña (con alternar mostrar/ocultar) +
 * `Iniciar sesión`. Mensaje genérico para credenciales inválidas, distinto
 * para verificación no disponible; nunca revela qué campo falló.
 */
export function LoginView() {
  const { state, login } = useSession();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // F10 — con sesión ya activa, redirige a Inicio; no se muestra un segundo
  // formulario ni se cierra la sesión (FR-057; SC-028).
  useEffect(() => {
    if (state.status === 'authenticated') {
      navigate('/', { replace: true });
    }
  }, [state.status, navigate]);

  useEffect(() => {
    // F1/D5 — foco al campo Usuario al montar.
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    // F4/D5 — foco al mensaje de error cuando aparece.
    if (message) messageRef.current?.focus();
  }, [message]);

  if (state.status === 'authenticated') {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (trimmedUsername.length === 0 || password.length === 0) {
      // FR-006 — campos vacíos: indicación de campo requerido, SIN llamar a login().
      setFieldErrors({
        username: trimmedUsername.length === 0,
        password: password.length === 0,
      });
      return;
    }

    setFieldErrors({});
    setMessage(null);
    setPending(true);
    const result = await login(trimmedUsername, password);
    setPending(false);

    if (!result.ok) {
      setMessage(result.reason === 'unavailable' ? idaf.auth.unavailable : idaf.auth.invalidCredentials);
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <main className="login-view">
      <div className="login-view__panel">
        <h1 className="login-view__brand">
          <Brand />
        </h1>
        <p className="login-view__purpose">{idaf.purpose}</p>

        <form className="login-view__form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="login-view__field">
            <label htmlFor="login-username">{idaf.auth.usernameLabel}</label>
            <input
              id="login-username"
              ref={usernameRef}
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-describedby={fieldErrors.username ? 'login-username-hint' : undefined}
              aria-invalid={fieldErrors.username ? true : undefined}
            />
            {fieldErrors.username ? (
              <p id="login-username-hint" className="login-view__hint">
                {idaf.auth.requiredField}
              </p>
            ) : null}
          </div>

          <div className="login-view__field">
            <label htmlFor="login-password">{idaf.auth.passwordLabel}</label>
            <div className="login-view__password-row">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={fieldErrors.password ? 'login-password-hint' : undefined}
                aria-invalid={fieldErrors.password ? true : undefined}
              />
              <button
                type="button"
                className="login-view__toggle-password"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? idaf.auth.hidePassword : idaf.auth.showPassword}
              >
                <Icon name={showPassword ? 'password-hide' : 'password-show'} />
              </button>
            </div>
            {fieldErrors.password ? (
              <p id="login-password-hint" className="login-view__hint">
                {idaf.auth.requiredField}
              </p>
            ) : null}
          </div>

          {message ? (
            <div className="login-view__message" role="alert" tabIndex={-1} ref={messageRef}>
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            className="login-view__submit"
            disabled={pending}
            aria-disabled={pending || undefined}
          >
            {idaf.auth.submitLabel}
          </button>
        </form>
      </div>
    </main>
  );
}
