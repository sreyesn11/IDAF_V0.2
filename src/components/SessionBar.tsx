import { useNavigate } from 'react-router-dom';
import { Icon } from './icons';
import { idaf } from '../content/idaf';
import { useSession } from '../auth/useSession';
import './SessionBar.css';

/**
 * Contexto de sesión: identidad + «Cerrar sesión», agrupados y separados de
 * la navegación (contract visual-system §3.3; research D9; FR-011/012/015).
 * Nombrado `SessionBar` (no `SessionContext`) para no confundirse con el
 * React context real (`src/auth/SessionProvider.tsx`).
 */
export function SessionBar() {
  const { state, logout } = useSession();
  const navigate = useNavigate();

  if (state.status !== 'authenticated') return null;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="session-bar" aria-label={idaf.session.regionLabel}>
      <span className="session-bar__identity">
        <Icon name="user" />
        <span className="session-bar__name" title={state.user.displayName}>
          {state.user.displayName}
        </span>
      </span>
      <button type="button" className="session-bar__logout" onClick={() => void handleLogout()}>
        <Icon name="logout" />
        <span>{idaf.session.logout}</span>
      </button>
    </div>
  );
}
