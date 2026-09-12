# Fase 1 — Modelo de datos

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

La SPEC 002 no introduce persistencia de dominio ni datos operacionales. Las
«entidades» son estructuras **en memoria** (del cliente y del servicio de
autenticación), un **marcador mínimo** en `sessionStorage`, una **cookie de
sesión** y **configuración de servicio** externa al repositorio. Todo texto visible
sigue la fuente única `src/content/idaf.ts` (Principio XI). La autoridad de
identidad es el **servicio de autenticación** (D1–D3).

---

## 1. Credenciales de acceso (`Credentials`)

Par usuario + contraseña introducido en la pantalla de acceso. **No se valida en el
cliente** y **no se persiste**: sólo se transporta una vez en el cuerpo de
`POST /api/auth/login` (mismo origen, HTTPS en despliegue).

| Campo | Tipo | Reglas de validación |
|-------|------|----------------------|
| `username` | `string` | Requerido. El cliente recorta el espacio al inicio/fin antes de enviar. Vacío tras recorte → el cliente **no** llama al servicio; muestra indicación de campo requerido (FR-006). |
| `password` | `string` | Requerido. **No** se recorta (los espacios pueden ser significativos). Vacío → el cliente no llama al servicio; indicación de campo requerido (FR-006). |

- La validez la decide **el servicio de autenticación** comparando contra el
  **Catálogo de cuentas** (§2): `username` coincide y
  `scrypt(password, account.salt)` es igual (`timingSafeEqual`) a
  `account.passwordHash`. El material de verificación (`salt`, `passwordHash`, la
  lógica de comparación) **no** existe en el frontend ni en el repositorio
  (FR-055).
- El resultado se representa en el cliente como `LoginResult`:
  - `{ ok: true, user }` — credenciales válidas.
  - `{ ok: false, reason: 'invalid_credentials' }` — credenciales inválidas o
    campos vacíos; **no** distingue «usuario no existe» de «contraseña incorrecta»
    (FR-004, FR-005): un único mensaje genérico.
  - `{ ok: false, reason: 'unavailable' }` — la verificación no pudo completarse
    (el servicio no respondió, `5xx`, timeout); mensaje **distinto** del anterior,
    sin crear sesión (FR-056).
- El cliente **nunca** guarda `password` ni lo escribe en `console`, almacenamiento
  o URL. El servicio **nunca** registra `password` ni `username` (FR-055;
  Principio VIII; SC-026).

## 2. Cuenta predefinida (`Account`) — configuración del servicio de autenticación

Entrada del catálogo de credenciales válidas. **Vive sólo en el servicio**, cargada
**en tiempo de ejecución** desde configuración **fuera del código fuente y fuera
del bundle del frontend**: `IDAF_ACCOUNTS_FILE` (ruta a un JSON fuera del
repositorio) o `IDAF_ACCOUNTS` (JSON en variable de entorno). Ver
[`contracts/auth-and-session.md`](./contracts/auth-and-session.md) §B.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `username` | `string` | Requerido, único (case-sensitive) en el catálogo. No vacío. |
| `displayName` | `string` | Requerido, no vacío. Nombre o identificador mostrado durante la sesión (FR-011, FR-052). Puede ser largo → la UI lo trunca (FR-045); el modelo no impone longitud máxima. |
| `salt` | `string` | Requerido. Sal aleatoria por cuenta, hex (≥ 16 bytes → ≥ 32 hex). |
| `passwordHash` | `string` | Requerido. `scrypt(password, salt)` en hex. **Nunca** la contraseña en claro, **nunca** un hash rápido reutilizable en el cliente. |

- **Invariantes** (verificadas al cargar el catálogo; ver `server/accounts.mjs`):
  - ≥ 1 cuenta; si el catálogo está ausente o mal formado → **error de arranque
    explícito** del servicio (no se degrada a «sin cuentas»).
  - `username` únicos; `salt` y `passwordHash` presentes y con formato hex.
- **Sin** campo de rol, permiso o perfil: todas las cuentas tienen la misma
  experiencia (FR-016). La SPEC 002 no crea, cambia ni recupera cuentas.
- **El repositorio no contiene `Account` con datos reales**: sólo
  `server/accounts.example.json` (placeholders) y
  `scripts/seed-dev-accounts.mjs`, que genera `server/accounts.dev.json`
  (**ignorado por git**) con cuentas desechables no secretas para desarrollo y E2E.
- **El frontend no importa ni recibe nunca `Account`** (ni `salt`, ni
  `passwordHash`).

## 3. Identidad de usuario mostrada (`DisplayedUser`)

Proyección de la cuenta autenticada que el **servicio** devuelve al frontend y que
la interfaz muestra como contexto de sesión.

| Campo | Tipo | Origen |
|-------|------|--------|
| `username` | `string` | De la cuenta autenticada. Lo devuelve el servicio en `login` y `session`; el cliente lo guarda en el marcador de `sessionStorage`. |
| `displayName` | `string` | `account.displayName`. Lo devuelve el servicio; es la «identificación comprensible» (Assumptions): no se requiere avatar, correo, rol ni datos de perfil. |

- El frontend **no** deriva la identidad de ningún catálogo local: siempre procede
  de la respuesta del servicio (`login` o `session`).
- Si al rehidratar el servicio responde `authenticated: false` (sesión expirada del
  lado del servidor, catálogo cambiado, etc.), la sesión del cliente pasa a
  `anonymous` y se muestra el acceso.

## 4. Sesión (`Session`)

Acceso autenticado y vigente de un usuario a IDAF. Tres representaciones
complementarias (D3):

### 4.1 Estado de cliente (`SessionProvider`, en memoria)

```text
SessionState =
  | { status: 'anonymous' }
  | { status: 'authenticated', user: DisplayedUser }
  | { status: 'loading' }   // sólo durante la rehidratación/revalidación inicial
```

### 4.2 Marcador de cliente (`sessionStorage`, clave `idaf.session`)

```text
{ "username": string, "displayName": string }   // SIN contraseña, SIN hash, SIN token portador
```

- Sirve para pintar el contexto de sesión sin esperar al servicio y para detectar
  «pestaña nueva» (una pestaña nueva no hereda `sessionStorage` → `anonymous`).
- Se escribe tras `login` con éxito y se borra en `logout` y cuando el servicio
  responde `authenticated: false`.

### 4.3 Sesión de servidor (`server/index.mjs`, `Map` en memoria)

```text
sessionId (opaco, base64url de 32 bytes)  →  { username: string, createdAt: number }
```

- Se entrega al cliente en una **cookie de sesión**
  `Set-Cookie: idaf_sid=<sessionId>; HttpOnly; SameSite=Strict; Path=/`
  (`Secure` bajo HTTPS). **Sin `Max-Age`/`Expires`** → el navegador la descarta al
  cerrarse. No legible por JavaScript. El nombre `idaf_sid` es deliberadamente
  distinto de la clave `idaf.session` del `sessionStorage` (§4.2).
- Es la **credencial de sesión real**; el `sessionId` no permite derivar la
  contraseña ni reutilizarse fuera de su cookie.

### Reglas

- Se **crea** (`anonymous → authenticated`) sólo tras `POST /api/auth/login` con
  respuesta `200`: el servicio registra la sesión y emite la cookie; el cliente
  escribe el marcador y pasa a `authenticated` con la identidad del servicio
  (FR-003).
- **Persiste ante la recarga de página**: al montar, si hay marcador,
  `SessionProvider` llama a `GET /api/auth/session`; con `authenticated: true`
  queda `authenticated` (FR-009, FR-051; CL-03).
- **Termina al cerrar la pestaña o el navegador**: la pestaña nueva no hereda
  `sessionStorage` (→ `anonymous`); al cerrar el navegador, además, la cookie de
  sesión desaparece (FR-051; CL-08; SC-024).
- Se **finaliza** explícitamente con `logout()`: `POST /api/auth/logout` (el
  servicio elimina la sesión del `Map` y vacía la cookie) + el cliente borra el
  marcador y pasa a `anonymous` (FR-013, FR-014; CL-05).
- **Multi-pestaña** (FR-058): la sesión de servidor es única para todas las
  pestañas (misma cookie). Al hacer `logout()` en una pestaña, las demás no lo
  saben de inmediato; con estado `authenticated` revalidan contra
  `GET /api/auth/session` al **reactivarse** (`visibilitychange`/`focus`) y al
  **recargar**, y entonces pasan a `anonymous` → `RequireSession` lleva a `/login`
  (CL-11; SC-029). No hay propagación en tiempo real.
- **Acceso con sesión activa** (FR-057): abrir `/login` con `authenticated`
  redirige a `/` (Inicio); no se cierra la sesión (CL-10; SC-028).
- **Verificación no disponible** (FR-056): si `POST /login` devuelve `503`/error de
  red, el estado permanece `anonymous`, no se escribe marcador y se muestra el
  mensaje `unavailable` (CL-09; SC-027).
- **No** hay expiración por tiempo ni por inactividad (FR-051).
- Determina el acceso al contenido interno: con `anonymous`, `RequireSession`
  impide montar las siete áreas (FR-001, FR-008, FR-010).

### Transiciones

| Desde | Evento | Hacia | Efectos |
|-------|--------|-------|---------|
| `anonymous` | `POST /login` → `200` | `authenticated` | servicio: registra sesión + `Set-Cookie`; cliente: escribe marcador, navega a `/` (Inicio), foco al `<h1>` del módulo (D5) |
| `anonymous` | `POST /login` → `401`/`400` / campos vacíos (no se llama) | `anonymous` | permanece en `/login`; mensaje `invalid_credentials` (`role="alert"`); foco al mensaje o al campo usuario (FR-054) |
| `anonymous` | `POST /login` → `503`/error de red/timeout | `anonymous` | permanece en `/login`; mensaje `unavailable`, **distinto** del anterior; no se escribe marcador (FR-056; SC-027) |
| `anonymous` | montaje con marcador presente → `GET /session` → `authenticated:true` | `authenticated` | rehidrata `user` desde la respuesta del servicio |
| `anonymous` | montaje con marcador presente → `GET /session` → `authenticated:false`/error | `anonymous` | borra el marcador |
| `anonymous` | montaje **sin** marcador (pestaña nueva) | `anonymous` | no consulta; opcionalmente `POST /logout` para descartar cookie remanente |
| `authenticated` | montaje/`login` con sesión ya activa | `authenticated` | redirige a `/` (Inicio); no muestra 2.º formulario; no cierra sesión (FR-057; SC-028) |
| `authenticated` | `logout()` | `anonymous` | `POST /logout` (borra sesión de servidor + cookie); cliente borra marcador; navega a `/login` (`replace`); foco al campo usuario |
| `authenticated` | reactivación de la pestaña (`visibilitychange`/`focus`) → `GET /session` → `authenticated:false` | `anonymous` | otra pestaña cerró la sesión; borra marcador; `RequireSession` → `/login` (FR-058; SC-029) |
| `authenticated` | reactivación → `GET /session` error de red | `authenticated` | no cierra la sesión ante un fallo transitorio de revalidación |
| `authenticated` | recarga de página | `authenticated` | marcador + cookie sobreviven; `GET /session` confirma; permanece en la misma ruta interna (FR-009) |
| `authenticated` | cierre de pestaña/navegador | — | `sessionStorage` no se hereda; al cerrar el navegador también cae la cookie; siguiente apertura → `anonymous` |
| cualquiera | varios `POST /login` fallidos seguidos | igual estado | sin bloqueo, sin error acumulado (FR-007; CL-02) |

## 5. Área principal / módulo (`FunctionalArea`) — **ampliada**

Una de las siete secciones fijas. Se conserva la entidad de la SPEC 001
([data-model](../001-idaf-foundation-navigation/data-model.md)) y se **añaden dos
campos**. Sigue siendo el `MODULE_REGISTRY` la lista única (FR-017, FR-025;
Principio V/XI).

| Campo | Tipo | Reglas | Cambio |
|-------|------|--------|--------|
| `id` | `FunctionalAreaId` | Slug estable no visible; único. Conjunto cerrado de 7. | (igual) |
| `path` | `string` | Ruta URL única; `/` para `home`. | (igual) |
| `label` | `string` | Texto visible único; de `content/idaf.ts`. Siempre visible junto al icono (FR-018). | (igual) |
| `order` | `number` | `1..7` contiguo, en el orden de FR-017. | (igual) |
| `status` | `'available' \| 'unavailable'` | Fijo en esta spec: sólo `home` es `available` (FR-043). | (igual) |
| `icon` | `IconName` | **NUEVO.** Nombre de un icono de la **única** familia (`src/components/icons`). Cada `id` tiene un `icon` propio y reconocible del concepto del área (FR-019, FR-020). Debe existir en el mapa de iconos. | añadido |
| `description` | `string \| undefined` | **NUEVO.** Descripción breve para `ModuleHeader` cuando aporta claridad (FR-033). De `content/idaf.ts`. Opcional. | añadido |
| `Component` | `ComponentType` | Vista de React sin props obligatorias. | (igual) |

- **Invariantes nuevas** (verificadas en `tests/unit/registry.test.ts`):
  - cada entrada tiene un `icon` que existe en el mapa de iconos;
  - los siete `icon` son siete valores distintos de la **misma** familia
    (`src/components/icons/paths.ts`), sin nombres de otra procedencia;
  - se conservan las invariantes previas (exactamente 7, `order` 1..7 contiguo,
    `id`/`path`/`label` únicos, sólo `home` `available`).
- **Condición de activo** (una sola a la vez): no es un campo del registro; se
  deriva de la ruta actual del router (`NavLink`/`aria-current`). FR-022 se cumple
  estructuralmente: la URL es única.

### Asociación área → icono (concepto, no implementación)

| `id` | Concepto del icono (FR-019) |
|------|------------------------------|
| `home` | inicio / panel |
| `inventory` | dispositivos / listado |
| `discovery` | búsqueda / exploración (lupa o radar) |
| `connections` | enlace / conexión |
| `diagnostics` | análisis / diagnóstico (pulso) |
| `topology` | red / relaciones (grafo de nodos) |
| `observability` | métricas / monitoreo (gráfica) |

## 6. Sistema visual (`VisualSystem`) — decisiones, no estructura de datos en runtime

Conjunto de decisiones de identidad reutilizadas en el acceso y en la aplicación.
Se materializa como **tokens CSS** (`src/styles/tokens.css`) + **componentes de
presentación** + **iconos**. Ver
[`contracts/visual-system.md`](./contracts/visual-system.md) para valores y
criterios.

| Aspecto | Materialización | Requisitos |
|---------|-----------------|------------|
| Marca | `Brand` (símbolo SVG propio + «IDAF»); compartida por Login y AppShell | FR-028, FR-029; SC-006, SC-007, SC-036, SC-037 |
| Roles de color | Custom properties: identidad, neutros (fondo/superficie/borde/texto/texto-atenuado), 4 familias semánticas con significado fijo | FR-037, FR-038, FR-040; SC-016, SC-036 |
| Tipografía | Escala de tamaños/pesos por token; una familia (stack del sistema); títulos consistentes; `<h1>` ≤ 2,0× cuerpo; `line-height` de contenido ≥ 1,4 | FR-036, FR-042; SC-019, SC-034, SC-035 |
| Familia iconográfica | `src/components/icons` — una rejilla 24, un grosor de trazo | FR-020, FR-024; SC-013, SC-036 |
| Superficies / tarjetas | `Surface` (token de superficie); sin datos | FR-035; SC-018, SC-036 |
| Encabezado de módulo | `ModuleHeader` (`<h1 tabIndex=-1>` + descripción) | FR-033; SC-017, SC-019, SC-036 |
| Estados de interacción | Matriz por token: normal / hover / activo / foco / deshabilitado / error; activo con ≥ 2 propiedades renderizadas, ≥ 1 no cromática | FR-041, FR-021; SC-022, SC-031 |
| Tratamiento de mensajes de error | Login: `role="alert"`, genérico, no revela el campo, no se superpone (contenedor con ancho acotado); mismo componente/tokens que la app interna | FR-004, FR-005, FR-047; SC-003, SC-020, SC-037 |
| Independencia del color | `StatusBadge` y estado activo: color + icono/forma/texto | FR-039; SC-015, SC-031 |
| Densidad y movimiento | Escalas de espaciado contenidas; sin huecos sin propósito > 1,5× `ModuleHeader`; hit-target ≥ 24×24; sin gráficos decorativos; transiciones/animaciones ≤ 150 ms con `iteration-count` finito | FR-030, FR-042; SC-032, SC-033, SC-034, SC-035 |
| Familia iconográfica / navegación única | Cada área con combinación (label, icon) única; sin entradas duplicadas; fuente única `MODULE_REGISTRY` | FR-025; SC-038 |
| Tema | Uno definitivo; todo color vía token → `[data-theme]` posible sin refactor | Assumptions |

---

## Grafo de dependencias entre módulos (sin ciclos)

```text
content/idaf.ts        ← (hoja) textos: producto, propósito, etiquetas, descripciones, textos de login/sesión/error
styles/tokens.css      ← (hoja) custom properties
components/icons/*      ← (hoja) paths + <Icon>

# Servicio de autenticación (proceso aparte; NO se importa desde el frontend)
server/accounts.mjs    → node:crypto (scrypt, timingSafeEqual), IDAF_ACCOUNTS_FILE / IDAF_ACCOUNTS
server/index.mjs       → node:http, node:crypto (randomBytes), server/accounts.mjs   [Map de sesiones en memoria]

# Frontend
auth/authClient.ts     → fetch('/api/auth/*')            [sólo HTTP; sin hash, sin catálogo, sin verificador]
auth/SessionProvider   → auth/authClient, sessionStorage
auth/useSession        → auth/SessionProvider
modules/registry.ts    → content/idaf.ts, components/icons (IconName), las 8 vistas
app/router.tsx         → modules/registry, app/RequireSession, app/AppLayout, modules/login/LoginView
app/RequireSession     → auth/useSession
app/AppLayout (Shell)  → components/{Brand, PrimaryNav, SessionBar}, styles
components/PrimaryNav   → modules/registry, components/icons, content/idaf.ts
components/SessionBar   → auth/useSession, components/icons, content/idaf.ts
components/ModuleHeader → content/idaf.ts
components/ModuleUnavailable → components/{ModuleHeader, StatusBadge, Icon}, content/idaf.ts
modules/login/LoginView → auth/useSession, components/{Brand, Icon}, content/idaf.ts
```

Ningún módulo del frontend importa lógica de autenticación ni catálogo de cuentas:
sólo `authClient` (HTTP). Ningún módulo del núcleo (`app/`) importa una vista de
área concreta salvo a través del registro; ninguna vista importa `registry.ts` (se
mantiene la regla de la SPEC 001).
