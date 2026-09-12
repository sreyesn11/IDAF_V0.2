import { Navigate } from 'react-router-dom';
import { useSession } from '../auth/useSession';
import { AppLayout } from './AppLayout';

/**
 * Guardián de ruta (contract auth-and-session.md §E). Corta ANTES de montar
 * cualquier contenido protegido: sin sesión, ninguna de las siete áreas llega
 * a existir en el DOM (FR-001, FR-008, FR-010).
 */
export function RequireSession() {
  const { state } = useSession();

  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  if (state.status === 'loading') {
    // Marcador neutro mínimo mientras se rehidrata: sin nav, sin contenido de
    // área, para no parpadear entre "sin sesión" y "con sesión" (E1).
    return <div aria-hidden="true" />;
  }

  return <AppLayout />;
}
