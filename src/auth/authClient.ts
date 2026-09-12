/**
 * Único punto de contacto del frontend con el servicio de autenticación
 * (contract auth-and-session.md §C). Sólo HTTP: sin hashing, sin catálogo, sin
 * verificación de credenciales, sin lógica de sesión de servidor.
 */
export interface DisplayedUser {
  username: string;
  displayName: string;
}

export type LoginResult =
  | { ok: true; user: DisplayedUser }
  | { ok: false; reason: 'invalid_credentials' | 'unavailable' };

export interface FetchSessionResult {
  authenticated: boolean;
  user?: DisplayedUser;
}

async function login(username: string, password: string): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (response.status === 200) {
    const body = (await response.json()) as { user: DisplayedUser };
    return { ok: true, user: body.user };
  }
  if (response.status === 401 || response.status === 400) {
    return { ok: false, reason: 'invalid_credentials' };
  }
  return { ok: false, reason: 'unavailable' };
}

/**
 * A diferencia de `login()`, aquí un fallo de red **no** se colapsa a un
 * resultado — la promesa se rechaza. Cada llamador decide qué significa un
 * fallo en su contexto: la rehidratación inicial lo trata como «sin sesión»
 * (D1), pero la revalidación en `visibilitychange`/`focus` NO debe cerrar la
 * sesión ante un error transitorio (D8) y necesita distinguir ambos casos.
 */
async function fetchSession(): Promise<FetchSessionResult> {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
  return (await response.json()) as FetchSessionResult;
}

async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch {
    // C4 — logout() resuelve siempre, aunque falle la red.
  }
}

export const authClient = { login, fetchSession, logout };
