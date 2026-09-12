# Fase 0 — Investigación y decisiones técnicas

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Regla aplicada en todo el documento (instrucción de planificación): *ante varias
alternativas válidas, se elige la más simple que satisface los requisitos actuales
y permite una evolución razonable*. No se añade arquitectura anticipada para specs
futuras.

Este documento sólo cubre las decisiones **nuevas** de la SPEC 002. Las decisiones
de base (SPA solo frontend para la interfaz, TypeScript + React 18, Vite 5, React
Router 6, registro único de módulos, `errorElement` + error boundary, fuente única
de textos, Vitest + Playwright) se heredan de
[`specs/001-idaf-foundation-navigation/research.md`](../001-idaf-foundation-navigation/research.md)
y no se reabren.

**No quedaron entradas `NEEDS CLARIFICATION`.** La spec + las clarificaciones de las
sesiones 2026-09-07 y 2026-09-08 + las Assumptions resuelven: modelo de cuentas
(varias, predefinidas, sin roles), semántica de sesión (sobrevive a la recarga,
muere al cerrar la pestaña; `/login` con sesión → Inicio; multi-pestaña tras
logout), verificación de acceso no disponible, gestión del foco al fallar el login,
contenido de Inicio, protocolo de evaluación con personas, criterios visuales
objetivos, contraste anclado a WCAG 2.1 AA en el FR, prohibición explícita de
material de verificación en frontend/repo, creación del símbolo de marca en esta
feature y comportamiento de ruta desconocida con sesión. La única decisión que la
spec delega expresamente y aquí se concreta es el **ancho mínimo soportado**
(D14: 1024 px).

---

## D1 — Frontera de autenticación: validación fuera del cliente, servicio mínimo de autenticación

- **Decisión**: la validación real de usuario y contraseña ocurre **fuera del
  navegador**, en un **servicio de autenticación mínimo** (`server/`, proceso
  Node 20 en ESM, sólo módulos nativos: `node:http`, `node:crypto`). Expone un
  contrato HTTP reducido:
  - `POST /api/auth/login` — recibe `{ username, password }`; valida contra el
    catálogo predefinido; en éxito crea una sesión de servidor y responde
    `{ user: { username, displayName } }` + `Set-Cookie` de sesión `HttpOnly`;
    ante credenciales inválidas o campos vacíos responde `401` con cuerpo genérico
    idéntico (FR-004, FR-005); ante un fallo interno que impide verificar (catálogo
    no cargado, error inesperado) responde `503 unavailable`, que el cliente
    traduce a un mensaje **distinto** del de credenciales incorrectas (FR-056).
  - `GET /api/auth/session` — a partir de la cookie, responde
    `{ authenticated: boolean, user? }`.
  - `POST /api/auth/logout` — invalida la sesión de servidor y borra la cookie;
    idempotente.
  - `GET /health` — para el arranque en pruebas.
  El **frontend no contiene** contraseñas, hashes reutilizables, verificadores de
  credenciales ni un catálogo de cuentas con material suficiente para validar
  localmente. Un único módulo `src/auth/authClient.ts` habla con el servicio
  (sólo `fetch` a `/api/auth/*`).
- **Rationale**:
  - **Principio VIII y §Dependencies de la spec**: cualquier verificador o catálogo
    embebido en el bundle es inspeccionable; no sería una frontera de seguridad
    real. Moviendo la validación al servicio, el bundle sólo transporta el
    formulario y el resultado.
  - **FR-050** delega el mecanismo en el plan; ésta es la decisión.
  - **§Out of Scope**: el servicio se acota a autenticar — sin alta de usuarios,
    sin cambio/recuperación de contraseña, sin roles, permisos, MFA ni bloqueo. No
    es un sistema de administración de identidades.
  - **Mínimo necesario**: `node:http` + `node:crypto` evita framework, ORM y
    librería de sesión; se mantiene «sin dependencias nuevas en tiempo de
    ejecución» (Principio VI).
- **Constitución**: cumple el Principio VIII **sin desviación** — ver
  `plan.md` §Constitution Check. La prohibición de material de verificación en el
  frontend/repositorio y de credenciales en logs es ahora un requisito explícito
  (FR-055, SC-025/SC-026), no sólo una dependencia.
- **Relación con la spec**: FR-003, FR-004, FR-005, FR-006, FR-007, FR-052, FR-055,
  FR-056; SC-002, SC-003, SC-025, SC-026, SC-027.
- **Alternativas consideradas**:
  - *Autenticación en el cliente (hash SHA-256 + catálogo inyectado al build)*:
    **rechazada** — el material de validación viaja al navegador y puede
    inspeccionarse; no es una frontera de seguridad (motivo de esta revisión del
    plan).
  - *Adoptar ya un IdP corporativo / OIDC completo*: rechazada — arquitectura
    anticipada y, de hecho, gestión de identidades (fuera de alcance). El contrato
    del servicio queda como punto de sustitución (D15 / contrato §G).
  - *Función serverless / BaaS de autenticación (Firebase Auth, Auth0…)*: rechazada
    para esta spec — añade dependencia y proveedor; el servicio propio de 3
    endpoints es más simple y neutral, y también es sustituible.

## D2 — Catálogo de cuentas: configuración del servicio en tiempo de ejecución, contraseñas con hash scrypt

- **Decisión**: el servicio carga el catálogo **en tiempo de ejecución** desde
  configuración **externa al código fuente y al bundle**:
  - `IDAF_ACCOUNTS_FILE` → ruta a un JSON **fuera del repositorio**, o
  - `IDAF_ACCOUNTS` → el mismo JSON en una variable de entorno.
  Formato por cuenta: `{ username, displayName, salt, passwordHash }`, donde
  `passwordHash = scrypt(password, salt)` (hex) y `salt` es aleatorio por cuenta.
  La verificación usa `crypto.scrypt` + `crypto.timingSafeEqual`. El repositorio
  sólo contiene `server/accounts.example.json` (placeholders) y
  `scripts/seed-dev-accounts.mjs`, que genera `server/accounts.dev.json`
  **ignorado por git** con cuentas **desechables no secretas** para desarrollo y
  E2E. `scripts/hash-account.mjs <password>` produce `{ salt, passwordHash }` para
  altas manuales.
- **Rationale**:
  - **Restricción «Gestión de secretos»**: «obtenerse en tiempo de ejecución desde
    un proveedor de secretos externo o mecanismo equivalente; el repositorio NO
    DEBE contener secretos reales» → un archivo/veriable fuera del repo es el
    mecanismo equivalente mínimo; el repo queda sin contraseñas ni hashes reales.
  - **Contraseñas nunca en texto plano** (requisito 6 de la revisión): sólo se
    guarda el hash `scrypt` con sal.
  - **`scrypt` sobre SHA-256**: `scrypt` es un KDF con coste de memoria/CPU,
    diseñado para contraseñas; está en `node:crypto` (sin dependencia). SHA-256
    plano es demasiado rápido para almacenar contraseñas aunque el hash no esté en
    el cliente.
  - **App ejecutable out-of-the-box**: `seed-dev-accounts` deja el entorno de
    desarrollo y los E2E funcionando sin colocar secretos en el repositorio.
- **Relación con la spec**: FR-052, FR-016; Assumptions («conjunto predefinido …
  configurado fuera de la interfaz»).
- **Alternativas consideradas**:
  - *Catálogo versionado con hashes en el repo*: rechazada — la restricción pide
    explícitamente que el repositorio no contenga secretos reales; un hash de
    contraseña real lo es.
  - *Base de datos de usuarios*: rechazada — persistencia y superficie
    innecesarias para un conjunto pequeño y fijo; roza la administración de
    identidades (fuera de alcance).
  - *`bcrypt`/`argon2`*: mejores KDF, pero son dependencias nativas; `scrypt`
    nativo de Node es suficiente y sin coste de dependencia.

## D3 — Representación y persistencia de la sesión: cookie HttpOnly del servicio + marcador no sensible en sessionStorage

- **Decisión**: dos piezas complementarias:
  - **Sesión de servidor**: al iniciar sesión, el servicio genera un `sessionId`
    opaco (`crypto.randomBytes(32).toString('base64url')`), lo guarda en un `Map`
    en memoria (`sessionId → { username, createdAt }`) y lo entrega en una
    **cookie de sesión** `Set-Cookie: idaf_sid=…; HttpOnly; SameSite=Strict;
    Path=/` (con `Secure` cuando se sirve por HTTPS). Sin `Max-Age`/`Expires` → es
    una **cookie de sesión**: el navegador la descarta al cerrarse. No legible por
    JavaScript. El nombre `idaf_sid` es deliberadamente distinto del marcador de
    `sessionStorage` `idaf.session` para que no se confundan en código, logs ni
    revisión.
  - **Marcador de cliente**: `SessionProvider` guarda en `sessionStorage`
    `idaf.session = { username, displayName }` — **sin** contraseña, **sin** hash,
    **sin** token portador. Es una representación para pintar el contexto de
    sesión y una señal de «esta pestaña tiene sesión».
  - **Rehidratación al montar**: si el marcador está presente, `SessionProvider`
    llama a `authClient.fetchSession()`; si el servicio responde
    `authenticated: true`, el estado pasa a `authenticated` con la identidad del
    **servicio** (autoridad); si responde `false` o falla, se limpia el marcador y
    el estado es `anonymous`. Si el marcador **no** está (pestaña nueva), el estado
    es `anonymous` sin consultar (y, por higiene, se puede pedir `logout` para
    descartar una cookie remanente).
  - **`logout()`**: `authClient.logout()` (el servicio borra la sesión del `Map` y
    vacía la cookie) + se limpia el marcador + estado `anonymous`.
  - **Revalidación multi-pestaña (FR-058)**: con estado `authenticated`,
    `SessionProvider` vuelve a llamar a `authClient.fetchSession()` cuando la
    pestaña pasa a visible (`visibilitychange`) y en el `focus` de la ventana; si
    el servicio responde `authenticated: false` (porque otra pestaña cerró la
    sesión de servidor, compartida por la cookie), limpia el marcador y pasa a
    `anonymous`. No hay canal en tiempo real entre pestañas.
- **Rationale**:
  - **FR-051 / CL-08**: la cookie de sesión cubre «cerrar el navegador»; el
    marcador en `sessionStorage` cubre además «cerrar la **pestaña**» desde la
    perspectiva del cliente (una pestaña nueva no hereda `sessionStorage`). Sin
    expiración por tiempo ni por inactividad.
  - **FR-009**: recargar una ruta interna con sesión conserva el acceso — el
    marcador y la cookie sobreviven a la recarga y la rehidratación ocurre antes
    del primer render de las rutas.
  - **FR-058 / CL-11**: la revalidación al recargar (rehidratación) y al reactivar
    la pestaña garantiza que, tras cerrar sesión en otra pestaña, las demás exigen
    acceso «a más tardar al recargar, al reactivarse o al intentar una operación
    que requiera la sesión», sin necesidad de `BroadcastChannel` ni de un `storage`
    event (que `sessionStorage` no emite entre pestañas).
  - **FR-057 / CL-10**: con sesión activa, la ruta `/login` redirige a Inicio (ver
    D4); no se muestra un segundo formulario ni se cierra la sesión.
  - **Principio VIII / FR-055**: en el cliente no hay contraseñas, hashes ni
    verificadores; la credencial de sesión real (`sessionId`) vive en cookie
    `HttpOnly`. El frontend sólo recibe `{ authenticated, user }`.
- **Relación con la spec**: FR-009, FR-011, FR-013, FR-051, FR-057, FR-058;
  SC-005, SC-024, SC-028, SC-029; CL-03, CL-04, CL-08, CL-10, CL-11.
- **Alternativas consideradas**:
  - *Sólo cookie de sesión, sin marcador*: cubre recarga y cierre de navegador,
    pero no distingue «pestaña cerrada» (algunas configuraciones restauran
    pestañas con la cookie viva); el marcador lo resuelve barato.
  - *Token (JWT/opaco) en `sessionStorage` leído por JS y enviado en `Authorization`*:
    rechazada — pone un bearer token en almacenamiento legible por script; la
    cookie `HttpOnly` es más segura y `SameSite=Strict` + mismo origen (proxy de
    Vite) basta para esta spec.
  - *Estado sólo en memoria*: rechazada — se pierde en cada recarga (viola
    FR-009/FR-051).

## D4 — Protección de rutas: zona pública `/login` + guardián `RequireSession`

- **Decisión**: el árbol de rutas se parte en dos:
  - **Pública**: `/login` → `LoginView`, fuera del `AppLayout` protegido.
  - **Protegida**: ruta padre con `element={<RequireSession/>}`; `RequireSession`
    lee `useSession()` y, si `status !== 'authenticated'`, hace
    `<Navigate to="/login" replace />`; si hay sesión, renderiza `<AppLayout/>` con
    su `<Outlet/>` (las siete áreas, como en la SPEC 001).
  - La **ruta comodín `*`** se evalúa **dentro** de la zona correspondiente: con
    sesión, `*` redirige a `/` (Inicio) sin error (FR-053); sin sesión, cualquier
    ruta protegida cae en el guardián y va a `/login` (FR-008, FR-010).
  - Tras `login()` con éxito, `LoginView` navega a `/` (`replace`). Tras `logout()`,
    se navega a `/login` (`replace`).
- **Rationale**:
  - **FR-001 / FR-008 / FR-010**: sin sesión, el contenido interno no se monta
    nunca —el guardián corta antes del `AppLayout`—, así que ninguna de las siete
    áreas es visible ni accesible.
  - **FR-053 / clarificación «ruta desconocida con sesión»**: la `*` de la zona
    protegida redirige a Inicio sin vista de «no encontrado».
  - `replace` en login y logout evita que el botón «atrás» reingrese a un estado
    inválido.
  - Reutiliza el patrón de la SPEC 001 (layout persistente + `<Outlet/>` + ruta
    comodín); sólo añade el guardián como envoltura.
- **Relación con la spec**: FR-001, FR-008, FR-009, FR-010, FR-013, FR-014, FR-053;
  SC-001, SC-004, SC-005, SC-023.
- **Alternativas consideradas**:
  - *Comprobar la sesión dentro de cada vista de módulo*: rechazada — repite la
    lógica siete veces y deja que el módulo se monte antes de redirigir.
  - *Un único router y ocultar la navegación por CSS cuando no hay sesión*:
    rechazada — el contenido seguiría en el DOM (viola «no accesible sin sesión»).

## D5 — Gestión del foco al iniciar y cerrar sesión

- **Decisión**: gestión de foco **mínima y explícita** con `useRef` + `useEffect`:
  - Al montar `LoginView`, el foco va al campo **usuario**.
  - Tras iniciar sesión con éxito, al renderizar el shell protegido el foco va al
    **encabezado del módulo** (`<h1>` de `ModuleHeader`, con `tabIndex={-1}`).
  - Tras cerrar sesión, al renderizar `LoginView` el foco va al **campo usuario**
    (o al `<h1>` del Login).
  - Cuando la autenticación falla, el foco va al **mensaje de error** (contenedor
    con `tabIndex={-1}`) o permanece en el campo usuario, y el mensaje se anuncia
    con `role="alert"`.
- **Rationale**: **FR-054** exige «gestión razonable del foco al iniciar y cerrar
  sesión» y nombres/roles accesibles, pero **no** una auditoría WCAG completa.
- **Relación con la spec**: FR-054; SC-022.
- **Alternativas consideradas**: *no gestionar el foco* (incumple FR-054);
  *librería de gestión de foco* (desproporcionada para tres transiciones).

## D6 — Sistema visual: CSS plano + custom properties, un único tema

- **Decisión**: los tokens de diseño se definen como **custom properties de CSS** en
  `:root` dentro de `src/styles/tokens.css`: color de identidad (`--color-identity*`),
  neutros (`--color-bg`, `--color-surface`, `--color-border`, `--color-text`,
  `--color-text-muted`), y **cuatro familias semánticas** con significado fijo
  (correcto/disponible/conectado, advertencia/atención, error/fallo/desconectado,
  info/identidad/selección); escala tipográfica, escala de espaciado, radios y
  anillo de foco. Un **único tema definitivo**; todas las declaraciones de color
  pasan por tokens → añadir `[data-theme="…"]` más adelante no exige refactor.
- **Rationale**: la SPEC 001 ya usa CSS por componente; mantener CSS plano + tokens
  es la continuación natural, sin Tailwind, sin CSS-in-JS, sin librería de temas
  (FR-050, Principio VI). **FR-037 / FR-038**: catálogo único de roles de color con
  significado consistente entre módulos → estructural. **Assumptions**: tema
  alterno sin reestructurar. Las escalas se eligen para cumplir los límites
  numéricos ya explícitos en la spec: `<h1>` de módulo ≤ ~2× el texto de cuerpo e
  interlineado de cuerpo ≥ 1,4 (FR-042); sólo microtransiciones de estado ≤ 150 ms,
  sin imágenes decorativas (FR-030); todos los pares de color cumplen WCAG 2.1 AA
  (FR-040 = SC-016).
- **Relación con la spec**: FR-027, FR-029, FR-030, FR-036, FR-037, FR-038, FR-040,
  FR-042; SC-016, SC-019.
- **Alternativas consideradas**: *Tailwind / design system* (dependencia grande y
  opinada; la spec pide sobriedad técnica); *CSS Modules / styled-components*
  (tooling o runtime; el aislamiento por convención de nombres ya funciona).

## D7 — Familia de iconos: SVG en línea escritos a mano

- **Decisión**: ~16 iconos como **componentes SVG en línea** generados desde un
  único `paths.ts` (rejilla 24×24, un grosor de trazo, `fill="none"` +
  `stroke="currentColor"`). `<Icon name/>` acepta `title` opcional y por defecto es
  `aria-hidden="true"` cuando acompaña a texto visible. Set: 7 de navegación + el
  **símbolo de marca** (nodos conectados, creado en esta feature) + UI
  (usuario/sesión, cerrar sesión, mostrar/ocultar contraseña) + los **cuatro**
  iconos semánticos de estado `status-ok`, `status-warn`, `status-error`,
  `status-info` (una familia semántica por FR-037; usados por `StatusBadge`).
- **Rationale**: **FR-020** («un único lenguaje visual») se garantiza si todos los
  iconos salen de la misma rejilla y archivo. **FR-024 / CL-07**: el nombre textual
  del área siempre acompaña al icono en `PrimaryNav`; con SVG en línea no hay
  petición de red que falle. Sin dependencia nueva (Principio VI).
- **Relación con la spec**: FR-018, FR-019, FR-020, FR-024, FR-028; SC-012, SC-013.
- **Alternativas consideradas**: *librería de iconos* (añade dependencia y riesgo
  de mezclar familias); *fuente de iconos* (peor accesibilidad, FOUT); *emojis*
  (estilo inconsistente entre plataformas).

## D8 — Estado activo de navegación con al menos dos señales simultáneas

- **Decisión**: la entrada activa de `PrimaryNav` combina **≥ 3 señales**:
  (1) `aria-current="page"` (lo pone `NavLink`); (2) una **barra/indicador de
  acento** sólido en el borde (forma, no sólo color); (3) **peso tipográfico**
  distinto + color de texto de identidad; (4) fondo de superficie elevado. El
  indicador de forma y el peso son perceptibles en escala de grises. Invariante
  «exactamente una activa» (FR-022): se deriva de la ruta actual del router, que es
  única; al no cachear vistas (D7 de la SPEC 001) no puede haber dos módulos
  montados. Cumple FR-021 revisado: la barra/indicador de acento (forma) y el peso
  tipográfico son señales **no cromáticas**, así que el estado activo se distingue
  también sin color (SC-015).
- **Relación con la spec**: FR-021, FR-022, FR-023; SC-010, SC-011, SC-015.
- **Alternativas consideradas**: *sólo color de fondo distinto* (insuficiente por
  FR-021); *subrayado animado* (innecesario; una barra estática cumple y es más
  sobria).

## D9 — Contexto de sesión: identidad + «Cerrar sesión» agrupados y separados de la navegación

- **Decisión**: un componente `SessionBar` en el **header** del shell (landmark
  `banner`), separado del `<nav>` lateral: icono de usuario + `displayName` y un
  **botón** «Cerrar sesión» (con icono), dentro de un contenedor propio
  (`aria-label="Sesión"`). El `displayName` largo se **trunca con elipsis** por CSS
  (`max-width` + `text-overflow`) y expone el valor completo en `title`. «Cerrar
  sesión» es un `<button>` real (no un enlace de módulo); su acción llama a
  `logout()` + navega a `/login`. Se llama `SessionBar` (no `SessionContext`) para
  que no se confunda con un React context; el contexto real de sesión es
  `src/auth/SessionProvider.tsx` / `useSession`.
- **Rationale**: **FR-011 / FR-012** (identidad y salida desde cualquier área,
  porque el header es persistente); **FR-015 / SC-009** (en su propia región
  etiquetada y con tratamiento visual distinto, no se confunde con una acción del
  módulo); **FR-045 / SC-020** (truncado por CSS).
- **Relación con la spec**: FR-011, FR-012, FR-015, FR-045; SC-008, SC-009, SC-020.
- **Alternativas consideradas**: *«Cerrar sesión» al final de la navegación*
  (rechazada por FR-015); *menú desplegable de usuario* (añade estado y foco; un
  botón visible se localiza antes — SC-008).

## D10 — Encabezado de módulo consistente (`ModuleHeader`)

- **Decisión**: `ModuleHeader({ title, description? })` renderiza un
  `<h1 tabIndex={-1}>` con el nombre del módulo y, si aporta claridad, un párrafo
  breve, con el mismo tratamiento en las siete áreas. Título = etiqueta del
  registro; descripción = nuevo campo `description` del registro / `content/idaf.ts`.
- **Rationale**: **FR-032 / FR-033 / SC-019** — un único componente evita
  divergencias; el `<h1 tabIndex={-1}>` es el destino de foco tras iniciar sesión
  (D5).
- **Relación con la spec**: FR-031, FR-032, FR-033, FR-036; SC-017, SC-019.

## D11 — Superficies/tarjetas y badges de estado como lenguaje visual, sin datos

- **Decisión**: `Surface` (contenedor con fondo/borde/radio de token; sin
  contenido de datos) y `StatusBadge({ kind, children })` con
  `kind ∈ {ok, warn, error, info}` que **siempre** combina color semántico + icono
  + texto, nunca sólo color. Se usan para el lenguaje visual (p. ej. el estado «No
  disponible»), **sin** datos operacionales reales ni simulados.
- **Rationale**: **FR-035** (tratamiento de superficies sin métricas ficticias);
  **FR-039 / SC-015** (badge legible sin color); **FR-034** (`main` dimensionado
  para contenido futuro sin implementarlo ahora).
- **Relación con la spec**: FR-034, FR-035, FR-039, FR-041; SC-014, SC-015, SC-018.

## D12 — Estructura del shell, zonas como landmarks y reparto del espacio

- **Decisión**: `AppLayout` pasa a ser un **AppShell** con rejilla CSS:
  `<header>` (`banner`: `Brand` + `SessionBar`), `<nav aria-label="Áreas de
  IDAF">` (`navigation`: barra lateral con las 7 entradas icono + nombre),
  `<main>` (`main`: región de mayor superficie, con `ModuleHeader` + `<Outlet/>`).
  En ≥ 1024 px la nav es columna lateral; al reducir hasta 1024 px se mantiene
  visible. Densidad moderada (FR-042).
- **Rationale**: **FR-031 / FR-032 / FR-054 / SC-017 / SC-018** (cuatro zonas
  distinguibles y estables, expuestas como landmarks; `main` como mayor
  superficie); **FR-046 / SC-021** (a 1024 px todo lo esencial sigue visible).
- **Relación con la spec**: FR-031, FR-032, FR-034, FR-042, FR-046, FR-054;
  SC-017, SC-018, SC-021, SC-022.
- **Alternativas consideradas**: *navegación superior* (la lateral escala mejor a
  siete entradas con icono + nombre); *hamburguesa bajo cierto ancho* (fuera de
  alcance; a 1024 px no hace falta).

## D13 — Estados de los elementos interactivos y contraste

- **Decisión**: matriz de estados por token para todo control (enlaces de nav,
  botones, campos): **normal, hover, seleccionado/activo, foco de teclado
  (`:focus-visible`, anillo de 3 px de alto contraste), deshabilitado (opacidad +
  `cursor:not-allowed` + `aria-disabled`), error (borde semántico + mensaje
  asociado con `aria-describedby`)**. Los pares de color cumplen **WCAG 2.1 AA**
  (4.5:1 texto normal, 3:1 texto grande y componentes), verificado en
  `quickstart.md` (checklist + axe-core opcional en el navegador de pruebas, sin
  añadir la dependencia).
- **Relación con la spec**: FR-040, FR-041; SC-016, SC-022.
- **Alternativas consideradas**: *estilos por defecto del navegador* (foco
  inconsistente y a veces invisible sobre fondos de color).

## D14 — Ancho mínimo soportado: 1024 px

- **Decisión**: el rango soportado de escritorio es **≥ 1024 px** de ancho de
  ventana. A 1024 px, navegación, identificación de sesión y «Cerrar sesión»
  permanecen visibles y utilizables (FR-046). Por debajo, el comportamiento no está
  garantizado (soporte móvil/responsive completo fuera de alcance).
- **Rationale**: la spec delega el valor exacto en el plan (Assumptions, FR-046).
  1024 px es el ancho de referencia mínimo habitual y el que usan los
  `devices['Desktop *']` de Playwright como base → verificable en CI.
- **Relación con la spec**: FR-046; SC-021.
- **Alternativas consideradas**: *1280 px* (deja fuera 1366×768 escalados);
  *768 px* (obligaría a un modo tablet que la spec excluye).

## D15 — Estrategia de pruebas (ampliación sobre la SPEC 001)

- **Decisión**: se conservan las dos capas y se añade lo específico de la SPEC 002.
  **Todos los E2E existentes de la SPEC 001 se adaptan** para iniciar sesión
  primero (helper `loginAs(page, account)` en `tests/e2e/_session.ts`) y se
  conserva su cobertura de navegación (regresión — Principio XII).
  - **Servicio de autenticación** (`tests/unit/auth-service.test.ts`, entorno
    `node`): carga y validación del catálogo `scrypt`; credenciales válidas →
    identidad; contraseña incorrecta y usuario inexistente → **misma** respuesta
    `401` (FR-004, FR-005); campos vacíos → `401` genérico; fallo interno
    (catálogo no cargado) → `503 unavailable`, nunca `401` (FR-056); ciclo de
    sesión (crear → `session` lo reconoce → `logout` lo invalida y `session` deja
    de reconocerla — FR-058); el servicio **no** escribe credenciales ni intentos
    en su salida (FR-055, FR-007).
  - **Cliente de autenticación** (`tests/unit/auth-client.test.ts`, `fetch`
    mockeado): `login()` hace `POST /api/auth/login` y devuelve la identidad;
    `401`/`400` → `{ ok:false, reason:'invalid_credentials' }`; `5xx`/error de
    red/timeout → `{ ok:false, reason:'unavailable' }` (FR-056); `fetchSession()`
    hace `GET`; `logout()` hace `POST`; nunca contacta otro origen; no guarda
    contraseñas ni tokens (FR-055).
  - **`SessionProvider`** (`session-provider.test.tsx`): `login`/`logout`;
    rehidratación vía `fetchSession()` + marcador de `sessionStorage`; el marcador
    contiene sólo `{ username, displayName }` (FR-055); revalidación en
    `visibilitychange`/`focus` que pasa a `anonymous` si el servicio responde
    `authenticated:false` (FR-058); redirección a `/` si `login`/montaje ocurre con
    sesión ya activa (FR-057).
  - **Estáticas / de repositorio** (`tests/unit/no-frontend-secrets.test.ts`):
    ningún módulo bajo `src/` importa `server/accounts*` ni define hashing o
    verificación de contraseñas; un escaneo del árbol `src/` y de la carpeta
    versionada no encuentra patrones de contraseña/hash/sal reales (FR-055;
    SC-025). Complementado por una comprobación del `dist/` construido en E2E.
  - **Resto de unitarias** (frontend, jsdom): `LoginView` (contenido FR-002;
    mensaje `invalid_credentials` genérico FR-004/FR-005; mensaje distinto para
    `unavailable` FR-056; foco al mensaje/formulario al fallar FR-054),
    `RequireSession` (sin sesión → `/login`), `PrimaryNav` (icono + nombre, familia
    única, activo con ≥ 2 señales de las que ≥ 1 es no cromática, exactamente uno),
    `SessionBar` (identidad + logout agrupados y separados; truncado),
    `ModuleHeader`, `HomeView` (identidad + propósito + vista general de las 7 áreas
    con estado; sin datos operacionales — FR-059), `ModuleUnavailable` (icono +
    nombre + «No disponible» + explicación; sin controles ni datos), `StatusBadge`
    (color + texto/icono), `registry` (invariantes previas + `icon` válido y de una
    sola familia), `tokens` (existen las custom properties de rol).
  - **E2E** (Playwright, con el servicio de autenticación y `preview` arrancados
    por `webServer`): `auth-login` (incluye caso «servicio detenido → mensaje
    "no se pudo verificar", sin sesión» — FR-056/SC-027; y «`/login` con sesión →
    Inicio» — FR-057/SC-028), `session-logout` (tras `logout` el servicio ya no
    reconoce la sesión), `session-persistence` (recarga conserva; vaciar
    `sessionStorage` simula cierre de pestaña → `/login`), `multi-tab-logout`
    (dos contextos/pestañas: `logout` en una → la otra muestra `/login` al
    reactivarse y al recargar — FR-058/SC-029), `nav-icons-active`,
    `product-identity`, `home-overview` (SC-030), `unavailable-modules`,
    `structure-consistency`, `keyboard-a11y` (incluye foco tras login fallido),
    `unknown-route` (con y sin sesión), `edge-cases` (texto largo, error largo,
    ancho 1024 px), `no-frontend-secrets` (escaneo de `dist/` — SC-025). El
    `no-device-data` de la SPEC 001 se mantiene y se extiende a las siete áreas
    autenticadas.
  - **Verificación manual guiada** (`quickstart.md`): contraste AA (SC-016),
    percepción sin color (SC-015), reconocimiento del producto (SC-006, SC-007),
    asociación icono→área sin etiqueta (SC-013), localización de sesión/logout en
    < 5 s (SC-008), identificación del módulo activo en ≤ 3 s (SC-010).
- **Rationale**: la lógica de credenciales se prueba en el servicio (entorno
  `node`), sin navegador; el frontend se prueba con `fetch` mockeado; los
  criterios que dependen de un navegador real (sesión que sobrevive a la recarga y
  muere al cerrar el contexto, URL, foco por teclado, landmarks, ancho de ventana)
  van a E2E. Adaptar —no descartar— los E2E de la SPEC 001 satisface la puerta de
  regresión del Principio XII.
- **Relación con la spec**: FR-001…FR-059; SC-001…SC-038 (los criterios con panel
  de personas —SC-006/007/009/010/013 y la cronometría de SC-008— se ejecutan según
  el protocolo normativo «Evaluación con personas» del spec; SC-031…SC-038 se
  añaden como criterios de verificación de los términos objetivados FR-021/027/029/
  030/042 y de FR-025, con cobertura en `visual-criteria.test.tsx` (nuevo),
  `structure-consistency.spec.ts`, `nav-icons-active.spec.ts`,
  `product-identity.spec.ts`, `primary-nav.test.tsx`, `registry.test.ts` y
  `tokens.test.ts`).
- **Alternativas consideradas**: *reescribir los E2E de la SPEC 001 desde cero*
  (se perdería la traza de regresión de la navegación base).

---

## Resumen de decisiones

| ID | Decisión | Requisitos que ancla |
|----|----------|----------------------|
| D1 | Validación fuera del cliente: servicio de autenticación mínimo (3 endpoints, sólo Node nativo); `503 unavailable` distinto de `401` | FR-003–FR-007, FR-052, FR-055, FR-056; SC-002/003/025/026/027; Principio VIII |
| D2 | Catálogo de cuentas desde configuración externa al repo en tiempo de ejecución; contraseñas con hash `scrypt` + sal | FR-052, FR-016, FR-055; SC-025; «Gestión de secretos» |
| D3 | Cookie de sesión `HttpOnly` del servicio + marcador no sensible en `sessionStorage`; rehidratación + revalidación en foco (multi-pestaña); `/login` con sesión → Inicio | FR-009, FR-011, FR-013, FR-051, FR-057, FR-058; SC-005/024/028/029; CL-03/04/08/10/11 |
| D4 | Zona pública `/login` + guardián `RequireSession`; `*` según haya sesión | FR-001, FR-008–FR-010, FR-014, FR-053; SC-001/004/023 |
| D5 | Gestión de foco mínima: al iniciar sesión → `<h1>` de Inicio; al cerrar → formulario; al fallar → mensaje de error o formulario | FR-054; SC-022 |
| D6 | CSS plano + custom properties; un tema, estructura para tema alterno | FR-027, FR-036–FR-038, FR-040, FR-042; SC-016/019/032/033/034/035/036 |
| D7 | ~16 iconos SVG en línea de una única rejilla (incl. status-ok/-warn/-error/-info); símbolo de marca propio | FR-018–FR-020, FR-024, FR-025, FR-028, FR-037; SC-012/013/036/037/038 |
| D8 | Estado activo de nav con forma + tipografía + color + `aria-current` | FR-021–FR-023; SC-010/011/015/031 |
| D9 | `SessionBar` (renombrado desde `SessionContext` para no confundir con un React context) en el header, agrupado y separado de la navegación | FR-011, FR-012, FR-015, FR-045; SC-008/009/020 |
| D10 | `ModuleHeader` único y consistente (`<h1 tabIndex=-1>` + descripción) | FR-031–FR-033, FR-036; SC-017/019 |
| D11 | `Surface` + `StatusBadge` como lenguaje visual, sin datos | FR-034, FR-035, FR-039, FR-041; SC-014/015/018 |
| D12 | AppShell con 4 zonas como landmarks; `main` = mayor superficie; ≥1024px | FR-031, FR-032, FR-034, FR-042, FR-046, FR-054; SC-017/018/021/022 |
| D13 | Matriz de estados por token + contraste WCAG 2.1 AA | FR-040, FR-041; SC-016/022 |
| D14 | Ancho mínimo soportado = 1024 px | FR-046; SC-021 |
| D15 | Vitest (frontend jsdom + servicio node) y Playwright ampliados; test estático «sin secretos en frontend»; E2E de la SPEC 001 adaptados (login primero) | FR-001–FR-059; SC-001–SC-030; Principio XII |
