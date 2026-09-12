# Contrato — Acceso y sesión

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md) · **Research**: [../research.md](../research.md) (D1–D5)

Define la frontera entre el **servicio de autenticación** (donde ocurre la
validación real) y el frontend, y el punto de sustitución por un proveedor
corporativo/externo (Principio VIII, 2.ª frase). El bundle del frontend y el
repositorio **no** contienen contraseñas, hashes de contraseñas, sales,
verificadores de credenciales ni un catálogo de cuentas válidas (FR-055; SC-025).

---

## A. Servicio de autenticación — contrato HTTP

Proceso Node 20 (`server/index.mjs`), sólo módulos nativos. Servido en el mismo
origen que el frontend mediante `proxy` de Vite sobre `/api` (dev y `preview`).
Puerto configurable con `IDAF_AUTH_PORT` (por defecto `8787`).

### A1 · `POST /api/auth/login`

| | |
|---|---|
| Petición | `Content-Type: application/json`, cuerpo `{ "username": string, "password": string }` |
| Éxito | `200`, cuerpo `{ "user": { "username": string, "displayName": string } }`, cabecera `Set-Cookie: idaf_sid=<opaco>; HttpOnly; SameSite=Strict; Path=/` (+ `Secure` bajo HTTPS), **sin** `Max-Age`/`Expires` (cookie de sesión). El nombre `idaf_sid` es deliberadamente distinto de la clave `idaf.session` del `sessionStorage` (§D) para no confundirlos. |
| Fallo de credenciales | `401`, cuerpo `{ "error": "invalid_credentials" }` — **idéntico** para usuario inexistente, contraseña incorrecta y campos vacíos (FR-004, FR-005) |
| Petición malformada (JSON inválido, falta un campo) | `400`, cuerpo `{ "error": "bad_request" }` (no revela nada de credenciales) |
| Verificación no disponible (fallo interno del servicio: catálogo no cargado, error inesperado) | `503`, cuerpo `{ "error": "unavailable" }` — no revela datos internos ni si el usuario existe (FR-056) |

**Garantías**

1. **A1.1** — La validación compara `username` (case-sensitive) y
   `timingSafeEqual(scrypt(password, account.salt), account.passwordHash)` contra
   el **Catálogo de cuentas** (§B). Nunca hay una vía que devuelva `200` sin esa
   comparación.
2. **A1.2** — La respuesta de fallo es un **único** `401` con cuerpo constante; el
   código de estado y el cuerpo no dependen de si el usuario existe (FR-005). El
   tiempo de respuesta se mantiene comparable (se ejecuta un `scrypt` de relleno
   con una sal fija si el usuario no existe) para no filtrar por temporización.
3. **A1.3** — En éxito, genera `sessionId = randomBytes(32).toString('base64url')`,
   registra `sessions.set(sessionId, { username, createdAt: Date.now() })` y lo
   entrega **sólo** en la cookie `HttpOnly`. El cuerpo **no** incluye el
   `sessionId` ni ningún token.
4. **A1.4** — No registra `username`, `password` ni ningún material de verificación
   (hash, sal) en la salida estándar ni en ningún archivo (FR-055; FR-007;
   Assumptions). Varios `401` seguidos no cambian ningún estado ni bloquean la
   cuenta (FR-007; CL-02).
5. **A1.5** — El `503` de "verificación no disponible" se reserva para fallos
   internos del servicio; **nunca** se usa para credenciales inválidas. El cliente
   lo traduce a un mensaje distinto (§C2, §F4; FR-056, SC-027).

### A2 · `GET /api/auth/session`

| | |
|---|---|
| Petición | envía la cookie `idaf_sid` automáticamente (mismo origen) |
| Con sesión válida | `200`, `{ "authenticated": true, "user": { "username": string, "displayName": string } }` |
| Sin cookie / cookie desconocida / sesión ya invalidada | `200`, `{ "authenticated": false }` |

**Garantías**

1. **A2.1** — `user.displayName` se resuelve **en el momento** desde el catálogo
   por el `username` de la sesión; si ese `username` ya no está en el catálogo,
   responde `{ authenticated: false }`.
2. **A2.2** — Idempotente y sin efectos secundarios.

### A3 · `POST /api/auth/logout`

| | |
|---|---|
| Petición | envía la cookie `idaf_sid` |
| Respuesta | `204`, cabecera `Set-Cookie: idaf_sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` |

**Garantías**

1. **A3.1** — `sessions.delete(sessionId)` de inmediato; una llamada posterior a
   `GET /session` con esa cookie responde `{ authenticated: false }` (FR-013).
2. **A3.2** — Idempotente: sin cookie o con sesión ya borrada → igualmente `204`.

### A4 · `GET /health`

`200` `{ "status": "ok" }`. Sin autenticación. Sólo para el arranque en pruebas
(`playwright.config.ts` `webServer`).

### A5 · Garantías transversales del servicio

- **A5.1 — Sin otras responsabilidades.** El servicio **no** ofrece alta, cambio ni
  recuperación de contraseña, ni roles, permisos, MFA, bloqueo de cuentas,
  expiración avanzada ni administración de identidades (spec §Out of Scope).
- **A5.2 — Almacén de sesiones en memoria.** Reiniciar el servicio invalida todas
  las sesiones (aceptable para esta spec; sin persistencia de sesión).
- **A5.3 — Mismo origen.** El frontend nunca llama a otro host; CORS no se abre.
- **A5.4 — Sin secretos en el repositorio ni en el cliente.** El código del
  servicio no contiene contraseñas ni hashes reales; el catálogo llega por
  configuración externa (§B). El material de verificación no se distribuye al
  frontend (FR-055; SC-025).

## B. Catálogo de cuentas — configuración del servicio

```jsonc
// Formato (array). Fuente: IDAF_ACCOUNTS_FILE (ruta a archivo FUERA del repo)
//                     o IDAF_ACCOUNTS (mismo JSON en variable de entorno).
[
  {
    "username": "operador",
    "displayName": "Operador de red",
    "salt": "<hex, >= 32 car.>",
    "passwordHash": "<scrypt(password, salt) en hex>"
  }
]
```

### Garantías

1. **B1 — Origen en tiempo de ejecución, externo al repositorio.** `accounts.mjs`
   lee `IDAF_ACCOUNTS_FILE` o `IDAF_ACCOUNTS` al arrancar. Si ninguna está
   definida en producción → **error de arranque explícito** (no se degrada a «sin
   cuentas» ni a un valor por defecto).
2. **B2 — Validación de esquema.** Cada entrada: `username` no vacío y único;
   `displayName` no vacío; `salt` y `passwordHash` hex no vacíos. Catálogo con ≥ 1
   entrada. Cualquier fallo → error de arranque con mensaje (sin volcar el
   contenido).
3. **B3 — Contraseñas sólo como hash.** `passwordHash = scrypt(password, salt)`;
   nunca texto plano; nunca un hash rápido de propósito general pensado para el
   cliente. La verificación usa `timingSafeEqual`.
4. **B4 — Repositorio limpio.** Versionado: `server/accounts.example.json` (sólo
   placeholders) y `scripts/hash-account.mjs` (genera `{salt, passwordHash}` para
   una contraseña). **No** versionado (`.gitignore`): `server/accounts.dev.json` y
   `tests/fixtures/accounts.e2e.json`, ambos generados por
   `scripts/seed-dev-accounts.mjs` con cuentas **desechables no secretas** para
   desarrollo y E2E. `server/README.md` documenta las credenciales de desarrollo
   como **no secretas**.
5. **B5 — Igualdad de experiencia.** `Account` no tiene rol ni permisos; todas las
   cuentas se comportan igual (FR-016).
6. **B6 — El frontend nunca ve el catálogo.** Ningún archivo bajo `src/` importa
   `accounts.*` ni recibe `salt`/`passwordHash`. No existe en `src/` ni en el
   bundle ninguna función que verifique credenciales (FR-055; SC-025).

### `.env.example` (contenido esperado)

```text
# Servicio de autenticación de IDAF (SPEC 002).
IDAF_AUTH_PORT=8787
# Catálogo de cuentas: UNA de las dos.
IDAF_ACCOUNTS_FILE=/ruta/fuera/del/repo/idaf-accounts.json
# IDAF_ACCOUNTS=[{"username":"...","displayName":"...","salt":"...","passwordHash":"..."}]
```

## C. `authClient` — único punto de contacto del frontend con el servicio

```ts
// src/auth/authClient.ts
export interface DisplayedUser { username: string; displayName: string }
export type LoginResult =
  | { ok: true; user: DisplayedUser }
  | { ok: false; reason: 'invalid_credentials' | 'unavailable' };

export const authClient: {
  login(username: string, password: string): Promise<LoginResult>;
  fetchSession(): Promise<{ authenticated: boolean; user?: DisplayedUser }>;
  logout(): Promise<void>;
};
```

### Garantías

1. **C1 — Sólo HTTP.** Cada método hace un `fetch` a `/api/auth/*` con
   `credentials: 'same-origin'`. **No** contiene hashing, catálogo, verificación de
   credenciales ni lógica de sesión de servidor.
2. **C2 — `login()`.** `POST /api/auth/login` con el cuerpo JSON. Traducción del
   resultado:
   - `200` → `{ ok: true, user }` (del cuerpo de la respuesta).
   - `401` o `400` → `{ ok: false, reason: 'invalid_credentials' }`. No distingue si
     falló el usuario o la contraseña ni si el usuario existe (FR-004, FR-005).
   - `503`, otro `5xx`, error de red o *timeout* →
     `{ ok: false, reason: 'unavailable' }` (FR-056).
   No reintenta. No registra las credenciales (FR-055).
3. **C3 — `fetchSession()`.** `GET /api/auth/session` → devuelve el cuerpo tal
   cual (`{ authenticated, user? }`).
4. **C4 — `logout()`.** `POST /api/auth/logout`; resuelve siempre (incluso ante
   error de red), para que el cierre de sesión del cliente nunca quede bloqueado.
5. **C5 — Sin almacenamiento.** No lee ni escribe `sessionStorage`,
   `localStorage`, ni cookies (la cookie de sesión la gestiona el navegador por
   ser `HttpOnly`). No registra credenciales.
6. **C6 — Sin acoplamiento de origen.** La URL base es relativa (`/api/...`); nunca
   un host externo.

## D. `SessionProvider` / `useSession`

```ts
// src/auth/SessionProvider.tsx
type SessionState =
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: DisplayedUser }
  | { status: 'loading' };   // sólo durante la rehidratación inicial

interface SessionApi {
  state: SessionState;
  /** Verifica contra el servicio y, si procede, abre sesión. */
  login(username: string, password: string): Promise<LoginResult>;
  /** Cierra la sesión de inmediato (servicio + cliente). */
  logout(): Promise<void>;
}

export function SessionProvider(props: { children: React.ReactNode }): JSX.Element;
export function useSession(): SessionApi; // lanza si se usa fuera del provider
```

### Garantías

1. **D1 — Rehidratación en el montaje.**
   - Lee `sessionStorage['idaf.session']`.
   - Si hay marcador `{ username, displayName }`: estado `loading`, llama a
     `authClient.fetchSession()`. `authenticated: true` → `authenticated` con
     `user` **de la respuesta del servicio** (autoridad). `authenticated: false` o
     error → borra el marcador → `anonymous`.
   - Si **no** hay marcador (pestaña nueva): `anonymous` sin llamar; opcionalmente
     `authClient.logout()` para descartar una cookie remanente.
   (FR-009, FR-051; CL-03; SC-005.)
2. **D2 — `login()`.** Llama a `authClient.login()`. `ok: true` → escribe
   `sessionStorage['idaf.session'] = JSON.stringify({ username, displayName })`
   (**sólo** eso; nunca contraseña, hash ni token) y pasa a `authenticated`.
   `ok: false` (cualquier `reason`) → no toca estado ni almacenamiento. Devuelve el
   `LoginResult` **con su `reason`** para que `LoginView` elija el mensaje
   correspondiente. (FR-003, FR-004, FR-056.)
3. **D3 — `logout()`.** `await authClient.logout()` (el servicio invalida la
   sesión y vacía la cookie), borra `sessionStorage['idaf.session']` y pasa a
   `anonymous`. Resuelve siempre. (FR-013; CL-05.)
4. **D4 — Sin expiración.** Sin temporizadores ni escuchas de inactividad
   (FR-051).
5. **D5 — Aislamiento.** Ningún componente fuera de `src/auth/` llama a
   `authClient` ni lee `sessionStorage` de sesión: todo pasa por `useSession()` y
   por `RequireSession`. Sustituir el interior de `SessionProvider`/`authClient`
   por integración con un IdP (OIDC/redirección) no cambia esta interfaz
   (Principio VIII, 2.ª frase).
6. **D6 — Sin registro de credenciales.** (FR-055.)
7. **D7 — `loading`.** `RequireSession` trata `loading` como «aún no anónimo»: no
   redirige a `/login` hasta que la rehidratación termina, para no expulsar al
   usuario en cada recarga (FR-009).
8. **D8 — Revalidación multi-pestaña (FR-058).** Cuando el estado es
   `authenticated`, `SessionProvider` revalida la sesión contra el servicio
   (`authClient.fetchSession()`) en estos eventos: (a) `visibilitychange` cuando la
   pestaña pasa a visible, y (b) `focus` de la ventana. Si el servicio responde
   `authenticated: false` (p. ej. porque se cerró sesión desde otra pestaña, lo que
   invalida la sesión de servidor compartida por la cookie), borra el marcador y
   pasa a `anonymous`; en la siguiente evaluación de ruta, `RequireSession` lleva a
   `/login`. No hay canal en tiempo real entre pestañas; la revalidación en foco +
   la que ya ocurre al recargar (D1) satisfacen «a más tardar al recargar, al
   reactivarse o al intentar una operación que requiera la sesión». Un error de red
   en esta revalidación **no** cierra la sesión (se mantiene el estado actual).

## E. `RequireSession` — guardián de ruta

```tsx
// src/app/RequireSession.tsx
export function RequireSession(): JSX.Element; // usa <Outlet/> internamente
```

### Garantías

1. **E1 — Corte antes del contenido.** Si `state.status === 'anonymous'`, renderiza
   `<Navigate to="/login" replace />` y **no** monta el `AppLayout` ni ninguna
   vista de área. Si `authenticated` → `<AppLayout/>` (con `<Outlet/>`). Si
   `loading` → un marcador neutro mínimo (sin contenido de área, sin parpadeo de
   navegación) hasta resolver. (FR-001, FR-008, FR-010; SC-001.)
2. **E2 — `replace`.** La redirección reemplaza la entrada de historial.
3. **E3 — Acceso directo por URL.** Abrir `/topologia` sin sesión → `/login`; con
   sesión → esa vista (FR-008, FR-009; CL-04).
4. **E4 — Recarga.** Como la rehidratación (D1) corre antes de resolver `anonymous`,
   recargar una ruta interna con sesión permanece en ella; sin sesión muestra el
   acceso (FR-009, FR-010; SC-005; CL-03, CL-04).

## F. `LoginView` — comportamiento observable

1. **F1 — Contenido mínimo** (FR-002): nombre «IDAF» + símbolo de marca,
   explicación breve del propósito (plataforma técnica de diagnóstico y
   observabilidad de red e IoT), campo **Usuario**, campo **Contraseña**
   (`type="password"` con alternar mostrar/ocultar), y una acción visible **Iniciar
   sesión** (`<button type="submit">`).
2. **F2 — Envío.** Recorta `username`; si `username` o `password` vacío → muestra
   indicación de campos requeridos, **sin** llamar a `login()` (FR-006). Si no,
   llama a `useSession().login()`.
3. **F3 — Éxito.** `login()` → `ok: true`: navega a `/` con `replace`; el foco pasa
   al `<h1>` del `ModuleHeader` de Inicio (D5). (FR-003.)
4. **F4 — Fallo.** `ok: false`: permanece en `/login`, muestra **un** mensaje en un
   contenedor con `role="alert"`, y el foco va a ese contenedor (o permanece en el
   campo Usuario) — FR-054. El mensaje depende del `reason`:
   - `'invalid_credentials'` → `idaf.auth.invalidCredentials` (p. ej. «Usuario o
     contraseña incorrectos.»). **No** indica qué campo falló ni si el usuario
     existe (FR-004, FR-005; SC-003).
   - `'unavailable'` → `idaf.auth.unavailable` (p. ej. «No se pudo verificar el
     acceso. Inténtalo de nuevo.»). Es **distinto** del anterior y tampoco revela
     datos internos (FR-056; SC-027).
   En ambos casos no se crea sesión; reintentos sucesivos no acumulan errores ni
   conceden acceso (FR-007; CL-02).
5. **F5 — Sin sesión visible.** Mientras se está en `/login` no se renderiza el
   `AppLayout` ni la navegación de áreas (SC-001).
6. **F6 — Error largo.** El contenedor del mensaje tiene ancho acotado y ajuste de
   línea; un mensaje de ≥ 200 caracteres no se superpone a los campos ni al botón
   (FR-047; SC-020).
7. **F7 — Identidad compartida (condiciones objetivas de FR-029; SC-037).** La
   pantalla de acceso cumple, de forma verificable: (1) muestra el nombre «IDAF» y
   el símbolo de marca vía `Brand` (el mismo componente que el `<header>` interno);
   (2) muestra el texto breve de propósito (`idaf.purpose` / equivalente) que la
   describe como plataforma técnica de diagnóstico y observabilidad de red e IoT;
   (3) el botón **Iniciar sesión** y el contenedor de mensaje de error usan los
   **mismos componentes y tokens** que la aplicación interna (misma matriz de
   estados de `visual-system.md` §4, mismo `role="alert"`); (4) **cero** imágenes o
   adornos puramente decorativos; y el formulario no se presenta con un estilo
   distinto al de los formularios/controles internos. Con esto, Login y aplicación
   interna se reconocen como el mismo producto (FR-029; SC-006, SC-007, **SC-037**).
8. **F8 — Teclado.** Todos los controles alcanzables y activables por teclado, con
   nombre y rol accesibles; `Enter` en cualquier campo envía el formulario
   (FR-054; SC-022).
9. **F9 — Estado de envío.** Mientras `login()` está en curso, el botón se
   deshabilita (`aria-disabled`) para evitar envíos dobles; no aparenta estar
   disponible mientras lo está (FR-041).
10. **F10 — Acceso con sesión activa.** Si al montar `LoginView` (o al resolver la
    ruta `/login`) `useSession().state.status === 'authenticated'`, se redirige a
    `/` con `replace`; no se renderiza un segundo formulario ni se cierra la sesión
    (FR-057; SC-028). Ver también `navigation-and-routes.md` §2 R2.

## G. Contrato de sustitución (evolución futura)

Una spec posterior puede reemplazar el **servicio de autenticación** por un
proveedor corporativo o externo (p. ej. OIDC / SAML / un IdP de la organización)
**conservando**:

- el contrato HTTP de §A (o adaptando `authClient` a un flujo de redirección
  equivalente que resuelva a los mismos `LoginResult` / `{ authenticated, user }`);
- la API de `SessionProvider`/`useSession` de §D;
- el comportamiento de `RequireSession` de §E.

`RequireSession`, `LoginView`, `SessionBar`, `PrimaryNav`, el `AppShell` y el
router **no** deben requerir cambios para esa sustitución. El catálogo local
`Account` y `scrypt` desaparecen en ese escenario sin afectar a la UI. Esto es lo
que satisface la 2.ª frase del Principio VIII («los mecanismos de autenticación
DEBEN poder sustituirse sin modificar la lógica principal del sistema»).
