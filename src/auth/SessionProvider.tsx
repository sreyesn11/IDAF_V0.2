import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { authClient, type DisplayedUser, type LoginResult } from './authClient';

const STORAGE_KEY = 'idaf.session';

export type SessionState =
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: DisplayedUser }
  | { status: 'loading' };

export interface SessionApi {
  state: SessionState;
  /** Verifica contra el servicio y, si procede, abre sesión (D2). */
  login(username: string, password: string): Promise<LoginResult>;
  /** Cierra la sesión de inmediato (servicio + cliente); resuelve siempre (D3). */
  logout(): Promise<void>;
}

export const SessionContext = createContext<SessionApi | undefined>(undefined);

function readMarker(): DisplayedUser | undefined {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<DisplayedUser>;
    if (typeof parsed.username === 'string' && typeof parsed.displayName === 'string') {
      return { username: parsed.username, displayName: parsed.displayName };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function writeMarker(user: DisplayedUser): void {
  // SOLO { username, displayName } — nunca contraseña, hash ni token (D2, FR-055).
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearMarker(): void {
  window.sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Contexto de sesión (contract auth-and-session.md §D). Rehidrata en el
 * montaje si hay marcador (D1), revalida en `visibilitychange`/`focus`
 * mientras hay sesión activa para propagar un `logout` de otra pestaña (D8;
 * FR-058), y nunca guarda contraseñas, hashes ni tokens (D6; FR-055).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const hadMarkerOnMount = useRef(readMarker() !== undefined);
  const [state, setState] = useState<SessionState>(() =>
    hadMarkerOnMount.current ? { status: 'loading' } : { status: 'anonymous' },
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!hadMarkerOnMount.current) return undefined;
    let cancelled = false;
    void authClient
      .fetchSession()
      .then((result) => {
        if (cancelled) return;
        if (result.authenticated && result.user) {
          setState({ status: 'authenticated', user: result.user });
        } else {
          clearMarker();
          setState({ status: 'anonymous' });
        }
      })
      .catch(() => {
        // D1 — un error en la rehidratación inicial también se resuelve a
        // "sin sesión" (a diferencia de la revalidación en foco, D8).
        if (cancelled) return;
        clearMarker();
        setState({ status: 'anonymous' });
      });
    return () => {
      cancelled = true;
    };
    // Sólo se rehidrata una vez, al montar (D1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const result = await authClient.login(username, password);
    if (result.ok) {
      writeMarker(result.user);
      setState({ status: 'authenticated', user: result.user });
    }
    return result;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authClient.logout();
    clearMarker();
    setState({ status: 'anonymous' });
  }, []);

  useEffect(() => {
    async function revalidate(): Promise<void> {
      if (stateRef.current.status !== 'authenticated') return;
      try {
        const result = await authClient.fetchSession();
        if (!result.authenticated) {
          clearMarker();
          setState({ status: 'anonymous' });
        }
      } catch {
        // D8 — un error de red durante la revalidación NO cierra la sesión;
        // se mantiene el estado actual hasta el siguiente intento.
      }
    }

    function onVisibilityChange(): void {
      if (document.visibilityState === 'visible') void revalidate();
    }
    function onFocus(): void {
      void revalidate();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const api: SessionApi = { state, login, logout };
  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}
