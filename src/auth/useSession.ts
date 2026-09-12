import { useContext } from 'react';
import { SessionContext, type SessionApi } from './SessionProvider';

/** Hook de consumo del contexto de sesión (contract auth-and-session.md §D). */
export function useSession(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) {
    throw new Error('useSession() debe usarse dentro de <SessionProvider>');
  }
  return api;
}
