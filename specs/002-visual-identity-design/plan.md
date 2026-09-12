# Implementation Plan: Experiencia visual, navegación y acceso de usuario de IDAF

**Branch**: `002-visual-identity-design` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-visual-identity-design/spec.md`

## Summary

SPEC 002 lleva la cáscara navegable de la SPEC 001 a su **experiencia de uso
completa**, sin añadir lógica operacional a ningún módulo:

1. **Acceso autenticado** — una pantalla de Login es la puerta de entrada; sin
   sesión válida las siete áreas no son visibles ni accesibles. Varias cuentas
   predefinidas, cada una con su propia contraseña y su nombre mostrado; mensaje de
   error genérico que no revela qué campo falló.
2. **Sesión y cierre de sesión** — la sesión sobrevive a la recarga y termina al
   cerrar la pestaña/navegador; identificación visible del usuario y acción de
   **Cerrar sesión** agrupadas como contexto de sesión, disponibles desde cualquier
   área.
3. **Identidad visual definitiva** — marca (nombre IDAF + símbolo original de
   nodos/conectividad), sistema de color con roles (identidad, neutros, semánticos),
   tipografía, familia iconográfica única, superficies/tarjetas, encabezado de
   módulo y estados de interacción; el Login y la aplicación interna se reconocen
   como el mismo producto.
4. **Navegación con icono + nombre** — las siete áreas fijas, cada una con un icono
   de la misma familia visual y su nombre siempre visible; el área activa se marca
   con al menos dos señales visuales simultáneas y siempre hay exactamente una
   activa.
5. **Estructura consistente y honesta** — la misma estructura (navegación, identidad
   de producto, contexto de sesión, contenido) en las siete áreas; los seis módulos
   pendientes conservan la identidad y muestran «No disponible» sin elementos
   simulados.

**Enfoque técnico** (la opción más simple que satisface los requisitos y permite
evolución): se **extiende** la SPA existente (TypeScript + React 18 + React Router 6
+ Vite 5); no se cambia de framework ni se añade UI kit. El registro de módulos
sigue siendo la fuente única de las siete áreas y se enriquece con `icon` y
`description` por entrada. La autenticación **no se resuelve en el cliente**: se
añade un **servicio mínimo de autenticación** (proceso Node aparte, sólo
dependencias nativas) responsable de recibir usuario y contraseña, validarlos
contra el conjunto predefinido de cuentas y devolver el resultado de autenticación
+ la identidad mostrada. El bundle del frontend **no** contiene contraseñas, hashes
reutilizables, verificadores de credenciales ni catálogo de cuentas. El servicio
mantiene la sesión del lado del servidor (identificador opaco en cookie
`HttpOnly`, cookie de sesión → muere al cerrar el navegador) y el frontend
conserva **sólo un marcador no sensible** en `sessionStorage`
(`{ username, displayName }`) para que cerrar la pestaña también termine la sesión
del lado del cliente (FR-051). El frontend habla con el servicio a través de un
único módulo `authClient` (sólo HTTP), que distingue «credenciales inválidas» de
«verificación no disponible» (FR-056); `SessionProvider` revalida contra el
servicio al reactivarse la pestaña para cerrar el acceso en las demás pestañas
tras un `logout` (FR-058). Vite hace `proxy` de `/api` para que todo sea del mismo
origen. El router se divide en una zona pública (`/login`, que con sesión activa
redirige a Inicio — FR-057) y una zona protegida tras un guardián de ruta
(`RequireSession`). El sistema visual se
implementa con **CSS plano + custom properties** (tokens en `:root`), un único tema
definitivo estructurado para admitir un tema alternativo más adelante. Los iconos
son **SVG en línea escritos a mano** en una única rejilla y grosor de trazo (una
sola familia visual, sin dependencia nueva).

## Technical Context

**Language/Version**: TypeScript 5.6 sobre Node.js 20 LTS. El frontend se entrega
como bundle estático; el **servicio de autenticación** es un proceso Node 20
(ESM, `.mjs`) que se despliega junto al estático.

**Primary Dependencies**: React 18.3, React Router 6.26 (`react-router-dom`),
Vite 5.4. **Sin dependencias nuevas en tiempo de ejecución**: el frontend no añade
librerías; el servicio de autenticación usa **sólo módulos nativos de Node**
(`node:http`, `node:crypto` — `scrypt`, `timingSafeEqual`, `randomBytes`). Sin
framework de servidor, sin ORM, sin librería de sesión.

**Storage**:
- **Servicio de autenticación**: catálogo de cuentas leído **en tiempo de
  ejecución** desde configuración **fuera del código fuente y fuera del bundle**
  (`IDAF_ACCOUNTS_FILE` → ruta a un JSON fuera del repositorio, o `IDAF_ACCOUNTS` →
  JSON en variable de entorno). Contraseñas guardadas **sólo como hash `scrypt`
  con sal por cuenta**, nunca en texto plano. Estado de sesión en un `Map`
  en memoria (`sessionId → { username, createdAt }`); sin base de datos.
- **Frontend**: `sessionStorage` del navegador con un **marcador no sensible**
  (`idaf.session = { username, displayName }`) — sin contraseñas, sin hashes, sin
  token portador. La credencial de sesión real es la cookie `HttpOnly` que emite el
  servicio (no legible por JavaScript). Sin `localStorage`, sin cookies legibles
  por script.

**Testing**: Vitest + React Testing Library + jsdom para unitarias/de componente
del frontend; Vitest en entorno `node` para la lógica del servicio de
autenticación (verificación de credenciales, hash, ciclo de sesión); Playwright
(Chromium, Firefox, WebKit) para end-to-end de acceso, sesión, recarga, navegación
con iconos, casos límite de estructura y operabilidad por teclado. Verificación de
contraste WCAG 2.1 AA y de percepción sin color mediante checklist manual guiada en
`quickstart.md` (más una comprobación opcional con axe-core en el navegador, sin
añadirlo como dependencia del proyecto).

**Target Platform**: Frontend en navegadores de escritorio evergreen (Chromium,
Firefox, WebKit). **Ancho mínimo soportado: 1024 px** (por debajo, el soporte
responsive completo queda fuera de alcance — FR-046). Servicio de autenticación en
Node 20 LTS. El frontend se sirve como bundle estático con *fallback* SPA a
`index.html` y `proxy` de `/api` hacia el servicio.

**Project Type**: Aplicación web = **SPA de frontend + servicio de autenticación
mínimo** (sin ninguna otra lógica de servidor). Proyecto único en la raíz del
repositorio; el servicio vive en `server/`.

**Performance Goals**: La navegación entre áreas no provoca recarga completa del
documento y permanece utilizable al alternar rápidamente (≥ 20 alternancias).
El inicio de sesión con credenciales válidas lleva a Inicio en < 30 s de
interacción del usuario (SC-002). El hash `scrypt` del servicio usa parámetros
estándar (coste ~ 16 ms – 100 ms por verificación), aceptable para un conjunto
pequeño de cuentas y sin objetivo numérico de la spec.

**Constraints**:
- La validación real de usuario y contraseña ocurre **fuera del cliente**, en el
  servicio de autenticación (FR-055).
- El bundle del frontend y el repositorio **no** contienen: contraseñas, hashes de
  contraseñas, sales, verificadores de credenciales, ni un catálogo de cuentas con
  material suficiente para validar autenticación localmente (FR-055; SC-025).
- Las credenciales válidas se configuran **fuera del código fuente y fuera del
  bundle** (variable de entorno o archivo fuera del repositorio); el repositorio no
  contiene contraseñas ni hashes reales. Las contraseñas nunca se almacenan en
  texto plano (FR-055).
- El frontend recibe del servicio **sólo** lo necesario para representar una sesión
  autenticada: estado autenticado + nombre/identificador mostrado del usuario
  (FR-055).
- El mensaje de credenciales inválidas es genérico y no revela qué campo falló
  (FR-004, FR-005). Existe un mensaje **distinto** para cuando la verificación no
  se pudo completar (servicio no disponible), sin conceder acceso ni crear sesión
  (FR-056; SC-027). Ni el frontend ni el servicio registran las credenciales ni los
  intentos (FR-055; SC-026; Assumptions).
- La sesión sobrevive a la recarga y termina al cerrar la pestaña/navegador
  (FR-051); sin expiración por tiempo ni por inactividad. `logout` la invalida de
  inmediato en el servicio y en el cliente; en otras pestañas sobre la misma sesión
  el acceso se cierra a más tardar al reactivarse o recargar (FR-058). Abrir
  `/login` con sesión activa redirige a Inicio (FR-057).
- El acceso a rutas protegidas sigue controlado por `RequireSession` (o mecanismo
  equivalente).
- La SPEC 002 **no** es un sistema de administración de usuarios: sin alta de
  usuarios desde la interfaz, sin cambio/recuperación de contraseña, sin roles, sin
  permisos, sin MFA, sin bloqueo de cuentas, sin expiración avanzada, sin gestión
  administrativa de identidades (spec §Out of Scope).
- Exactamente siete áreas, sin crear áreas nuevas (FR-017); los seis módulos
  pendientes no reciben lógica operacional (FR-043) ni contenido simulado (FR-044).
- Interfaz en español (FR-049).
- Un único tema visual definitivo, estructurado para admitir un tema alternativo
  sin reestructurar (Assumptions).
- Accesibilidad acotada: foco de teclado visible + contraste AA + operabilidad
  completa por teclado de los elementos interactivos + nombres/roles accesibles +
  landmarks de las zonas principales + gestión razonable del foco al iniciar y
  cerrar sesión (FR-054). La conformidad WCAG 2.1 AA completa queda fuera de
  alcance.

**Scale/Scope**: 1 pantalla de acceso + 7 áreas protegidas (1 funcional: Inicio;
6 vistas «No disponible») + 1 vista de error de sección. 1 servicio de
autenticación con 3 endpoints (`login`, `logout`, `session`) + `health`, y un
almacén de sesiones en memoria. Varias cuentas predefinidas (orden de magnitud:
2–10), sin roles ni perfiles (FR-016). ~10 componentes de presentación nuevos o
modificados, 1 proveedor de sesión, 1 cliente HTTP de autenticación, 1 guardián de
ruta, 1 hoja de tokens de diseño, ~16 iconos SVG (7 de navegación + símbolo de
marca + iconos de UI: sesión, cerrar sesión, mostrar/ocultar contraseña + los
**cuatro** iconos semánticos de estado `status-ok`, `status-warn`,
`status-error`, `status-info`, alineados con las 4 familias semánticas de
FR-037 y con `T017` / `StatusBadge` (`T064`)).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

La Constitución de IDAF v1.0.0 tiene 12 principios. La mayoría regula
descubrimiento, inventario, conexión con dispositivos, diagnóstico, topología real
y telemetría — todo **explícitamente fuera del alcance** de esta spec (spec §Out of
Scope, FR-043, FR-048). Esos principios no se violan porque las capacidades que
gobiernan no se implementan ni se simulan.

| Principio | Aplicabilidad a SPEC 002 | Cumplimiento del plan |
|-----------|--------------------------|-----------------------|
| I. Descubrimiento seguro y no destructivo | No aplica: sin interacción con dispositivos. | ✅ Trivial. |
| II. Separación descubrimiento/gestión | No aplica: sin inventario. | ✅ Trivial. |
| III. Identidad única y consistente (dispositivos) | No aplica: sin dispositivos. | ✅ Trivial. |
| IV. Diagnóstico trazable | No aplica: sin diagnósticos. | ✅ Trivial. |
| **V. Arquitectura modular y extensible** | **Aplica directamente.** | ✅ El registro de módulos sigue siendo la fuente única; se le añaden campos `icon` y `description` sin crear listas paralelas. El acceso se incorpora como una **capa** alrededor del router (`SessionProvider` + guardián) y un **servicio aislado**; el núcleo de navegación no cambia. Añadir la lógica real de un módulo en una spec futura sigue siendo cambiar su entrada del registro + su componente. Ver `contracts/`. |
| VI. Independencia tecnológica y de fabricante | Aplica de forma preventiva. | ✅ Sin dependencias de fabricante; el frontend habla con el servicio por HTTP a través de `authClient`, y el servicio expone un contrato neutral (usuario+contraseña → resultado+identidad) sustituible por un proveedor corporativo/externo sin tocar la UI ni el shell. Iconos SVG propios, no una librería de un proveedor. |
| VII. Diagnóstico antes que modificación | No aplica. | ✅ Trivial. |
| **VIII. Seguridad de acceso** | **Aplica directamente** (spec §Dependencies lo cita; ahora también FR-055 y SC-025/SC-026). | ✅ **Cumple sin desviaciones.** La validación de credenciales ocurre **fuera del cliente** (FR-055). El código fuente y el bundle del frontend y el repositorio **no** contienen credenciales, hashes, sales, verificadores ni catálogo de cuentas (FR-055; verificable por SC-025). Las contraseñas se guardan sólo como hash `scrypt` con sal, del lado del servicio, y el catálogo se obtiene **en tiempo de ejecución** desde configuración externa al repositorio (`IDAF_ACCOUNTS_FILE` / `IDAF_ACCOUNTS`). Nada de credenciales en logs ni en la interfaz — mensaje genérico (FR-004/FR-005), mensaje distinto y genérico para «verificación no disponible» (FR-056), sin registro de intentos (SC-026). El mecanismo está aislado tras el contrato HTTP del servicio + `authClient` + `SessionProvider`, sustituible por un IdP corporativo sin tocar la lógica principal (Principio VIII, 2.ª frase). |
| IX. Observabilidad como capacidad fundamental | No aplica como módulo; sí como higiene. | ✅ Los errores visibles al usuario son comprensibles y genéricos; los detalles técnicos van a `console.error` (frontend) o a la salida estándar del servicio sin credenciales, nunca al DOM. No se construye telemetría (fuera de alcance) y **no** se registran intentos de acceso ni credenciales. |
| X. Evolución hacia diagnóstico inteligente | No aplica: sin IA. | ✅ Trivial. |
| XI. Fuente de verdad consistente | Aplica en pequeño: terminología y tokens. | ✅ Fuente única de textos (`src/content/idaf.ts`, ampliada) y fuente única de decisiones visuales (`src/styles/tokens.css` + registro con `icon`/`description`), consumidas por Login y por las siete áreas → consistencia estructural (FR-025, FR-036, FR-038). La identidad mostrada del usuario proviene siempre del servicio (única autoridad de cuentas). |
| **XII. Integridad del sistema** | **Aplica como criterio de diseño.** | ✅ La SPEC 002 puede modificar la estructura visual y de navegación (spec §Assumptions, FR-048) pero **no** añade lógica operacional a los seis módulos pendientes (FR-043). La navegación derivada del registro y el comportamiento de rutas de la SPEC 001 se conservan; la cobertura de regresión E2E existente se adapta (login primero) y se amplía. El servicio de autenticación es un componente nuevo y aislado; no toca el núcleo de navegación. |

**Restricciones Adicionales**:
- *Operaciones de escritura sobre dispositivos* — no aplica (sin dispositivos).
- *Gestión de secretos* — «las credenciales DEBEN obtenerse en tiempo de ejecución
  desde un proveedor de secretos externo o mecanismo equivalente; el repositorio
  NO DEBE contener secretos reales»: ✅ **se cumple** — el servicio lee el catálogo
  en tiempo de ejecución desde `IDAF_ACCOUNTS_FILE` (archivo fuera del repositorio)
  o `IDAF_ACCOUNTS` (variable de entorno); el repositorio sólo contiene
  `server/accounts.example.json` (placeholders) y un generador de fixtures de
  desarrollo desechables que produce un archivo **ignorado por git**. Ninguna
  contraseña ni hash real versionado. Las contraseñas se almacenan sólo como hash
  `scrypt` con sal.
- *Neutralidad del núcleo* — ✅ el núcleo no importa nada específico de un área ni
  de un fabricante; el frontend no importa lógica de autenticación, sólo el cliente
  HTTP.
- *Persistencia con historial* — no aplica (sin inventario ni diagnósticos que
  persistir).
- *Correlación de identidad* — no aplica (sin dispositivos).

**Flujo de Desarrollo y Puertas de Calidad**: el PR de esta feature verificará los
12 principios (esta tabla). No toca descubrimiento/inventario/conexión/diagnóstico/
trazabilidad de dispositivos; la única regresión relevante es la navegación de la
SPEC 001, cubierta por E2E adaptados. La revisión de código debe rechazar cualquier
contraseña o hash real en el código fuente, en el bundle, en logs o en resultados;
este plan lo previene por diseño (validación en el servicio + catálogo externo al
repositorio + hash `scrypt`).

**Resultado de la puerta (pre-Fase 0)**: ✅ PASA. Sin violaciones de la
Constitución. `Complexity Tracking` no registra ninguna desviación de seguridad;
sólo deja constancia, para trazabilidad, de dos adiciones deliberadas de estructura
respecto a la SPEC 001.

**Re-verificación post-implementación (T088, `/speckit-implement`)**: ✅ PASA sin
desviaciones. Verificado contra el código entregado: (V) `MODULE_REGISTRY`
sigue siendo la única fuente de las 7 áreas, ahora con `icon`/`description`;
`RequireSession` + `SessionProvider` se añaden como capa alrededor del router
sin tocar el núcleo de navegación. (VI) `server/` usa sólo `node:http` +
`node:crypto`; cero dependencias nuevas en tiempo de ejecución (`package.json`
sin cambios en `dependencies`; `@types/node` es sólo de desarrollo). (VIII)
`tests/unit/no-frontend-secrets.test.ts` y `tests/e2e/no-frontend-secrets.spec.ts`
confirman que `src/` y `dist/` no contienen `scrypt`/`timingSafeEqual`/
`passwordHash`/`salt` ni importan `server/accounts*`; el catálogo real nunca se
versiona (sólo `server/accounts.example.json` con placeholders). (XI)
`src/content/idaf.ts` y `src/styles/tokens.css` siguen siendo las fuentes
únicas de texto y de decisiones visuales. (XII) Las seis áreas pendientes no
recibieron lógica operacional; los E2E de la SPEC 001 (`navigation.spec.ts`,
`reload.spec.ts`, `repeat-and-rapid.spec.ts`, `a11y-nav.spec.ts`,
`no-device-data.spec.ts`, `unknown-route.spec.ts`) se adaptaron para iniciar
sesión primero y siguen verificando la misma regresión de navegación.
`tests/unit` (124/124) y `npm run build` pasan limpios. `npm run test:e2e`
verificado funcionalmente por muestreo (autenticación, sesión, navegación,
identidad visual, accesibilidad) — la ejecución completa de las tres suites de
navegador en el entorno de este agente resultó intermitente por agotamiento de
puertos efímeros del sandbox (`EADDRINUSE`/`ERR_ADDRESS_IN_USE` en
`127.0.0.1:4173`), no por fallos de aserción de la aplicación; se recomienda
re-ejecutar `npm run test:e2e` en CI/local antes de mergear.

**Re-evaluación post-Fase 1**: ✅ PASA sin cambios. Los artefactos de diseño
(`research.md`, `data-model.md`, `contracts/auth-and-session.md`,
`contracts/navigation-and-routes.md`, `contracts/visual-system.md`,
`quickstart.md`) refuerzan el Principio V (registro único ampliado; acceso como
capa + servicio aislado), el Principio VI/VIII (contrato de servicio neutral y
sustituible; cero credenciales, hashes, verificadores o catálogo en el frontend;
catálogo obtenido en tiempo de ejecución desde fuera del repositorio) y el
Principio XI (fuente única de textos y de tokens; el servicio como única autoridad
de identidad). No se introdujo ninguna dependencia nueva en tiempo de ejecución.

## Project Structure

### Documentation (this feature)

```text
specs/002-visual-identity-design/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Fase 0 — decisiones técnicas nuevas de la SPEC 002 y su relación con la spec
├── data-model.md        # Fase 1 — entidades: Sesión, Credenciales, Cuenta (servidor), Identidad mostrada, Área (con icono), Sistema visual
├── quickstart.md        # Fase 1 — guía de ejecución y validación (SC-001…SC-038)
├── contracts/           # Fase 1 — contratos internos
│   ├── auth-and-session.md        # Contrato HTTP del servicio de autenticación, authClient, SessionProvider, RequireSession, catálogo de cuentas
│   ├── navigation-and-routes.md   # Zona pública/protegida, tabla de rutas, estado activo, ruta desconocida
│   └── visual-system.md           # Tokens de color/tipografía/espaciado, familia de iconos, superficies, encabezado de módulo, estados
├── checklists/
│   └── requirements.md  # (ya existente)
└── tasks.md             # Fase 2 (/speckit-tasks — NO lo crea /speckit-plan)
```

### Source Code (repository root)

```text
idaf_project/
├── index.html                     # Punto de entrada del bundle Vite (título/lang sin cambios)
├── .env.example                   # NUEVO — IDAF_ACCOUNTS_FILE / IDAF_ACCOUNTS, IDAF_AUTH_PORT, sin valores reales
├── package.json                   # + scripts "auth" (arranca el servicio) y "auth:seed" (genera fixtures de desarrollo); sin dependencias nuevas
├── vite.config.ts                 # MODIFICADO — server.proxy y preview.proxy: "/api" → servicio de autenticación
├── playwright.config.ts           # MODIFICADO — webServer como lista (servicio de autenticación + preview) + globalSetup que siembra el fixture de cuentas E2E si falta (sin auth:seed manual)
├── server/                        # NUEVO — servicio mínimo de autenticación (Node 20, ESM, sólo módulos nativos)
│   ├── index.mjs                  # node:http; rutas /api/auth/login|logout|session y /health; cookie de sesión HttpOnly; Map de sesiones en memoria
│   ├── accounts.mjs               # carga y valida el catálogo desde IDAF_ACCOUNTS_FILE / IDAF_ACCOUNTS (fuera del repo); verifica scrypt + timingSafeEqual
│   ├── accounts.example.json      # plantilla del catálogo (placeholders, sin secretos)
│   └── README.md                  # cómo configurar el catálogo y generar hashes
├── scripts/
│   ├── hash-account.mjs           # NUEVO — imprime {salt, passwordHash} scrypt para una contraseña dada
│   └── seed-dev-accounts.mjs      # NUEVO — genera server/accounts.dev.json (IGNORADO por git) con cuentas desechables no secretas para desarrollo y E2E
├── src/
│   ├── main.tsx                   # sin cambios (monta <App/>)
│   ├── App.tsx                    # MODIFICADO — envuelve el router con <SessionProvider>
│   ├── app/
│   │   ├── router.tsx             # MODIFICADO — zona pública (/login) + zona protegida tras <RequireSession>; ruta comodín depende de si hay sesión
│   │   ├── RequireSession.tsx     # NUEVO — guardián: sin sesión → <Navigate to="/login">; con sesión → <Outlet/>
│   │   ├── AppLayout.tsx          # MODIFICADO — AppShell con landmarks: header (marca + contexto de sesión), nav lateral, main
│   │   ├── AppLayout.css          # NUEVO — rejilla del shell, zonas, densidad, ancho mínimo 1024px
│   │   ├── RouteError.tsx         # sin cambios de comportamiento (reestilizado por tokens)
│   │   └── RootErrorBoundary.tsx  # sin cambios
│   ├── auth/
│   │   ├── SessionProvider.tsx    # NUEVO — contexto de sesión: estado {status,user}, login(), logout(); rehidrata con authClient.fetchSession(); revalida en visibilitychange/focus (FR-058); redirige a / si hay sesión (FR-057); marcador NO sensible en sessionStorage
│   │   ├── useSession.ts          # NUEVO — hook de consumo del contexto
│   │   └── authClient.ts          # NUEVO — ÚNICO punto de contacto con el servicio: login()/fetchSession()/logout() vía fetch a /api/auth/*. Sin hash, sin catálogo, sin verificador. login() → {ok:false, reason:'invalid_credentials'|'unavailable'} (FR-056)
│   ├── modules/
│   │   ├── types.ts              # MODIFICADO — FunctionalArea gana `icon: IconName` y `description?: string`
│   │   ├── registry.ts          # MODIFICADO — cada entrada define icon y description; sigue siendo la lista única
│   │   ├── home/HomeView.tsx     # MODIFICADO — usa <ModuleHeader>; sin datos simulados (se conserva)
│   │   ├── inventory/InventoryView.tsx      # usa <ModuleUnavailable> (reescrito)
│   │   ├── discovery/DiscoveryView.tsx
│   │   ├── connections/ConnectionsView.tsx
│   │   ├── diagnostics/DiagnosticsView.tsx
│   │   ├── topology/TopologyView.tsx
│   │   └── observability/ObservabilityView.tsx
│   ├── modules/login/
│   │   ├── LoginView.tsx          # NUEVO — pantalla de acceso: marca + propósito + usuario + contraseña + acción; mensaje genérico (invalid_credentials) y mensaje distinto (unavailable, FR-056); foco al fallar (FR-054); redirige a / si hay sesión (FR-057); llama useSession().login()
│   │   └── LoginView.css          # NUEVO
│   ├── components/
│   │   ├── PrimaryNav.tsx        # MODIFICADO — icono + nombre por entrada; activo con ≥2 señales; aria-current
│   │   ├── PrimaryNav.css        # MODIFICADO — estados normal/activo/foco/hover por tokens
│   │   ├── SessionBar.tsx        # NUEVO — identidad del usuario + acción "Cerrar sesión", agrupadas y separadas de la navegación (FR-015); nombre elegido para no confundir con un React context (el provider es src/auth/SessionProvider.tsx)
│   │   ├── SessionBar.css        # NUEVO — truncado de identificador largo (FR-045)
│   │   ├── ModuleHeader.tsx      # NUEVO — encabezado consistente: nombre del módulo + descripción breve opcional
│   │   ├── ModuleUnavailable.tsx # MODIFICADO — icono del módulo + nombre + estado "No disponible" + explicación; sin controles ni datos
│   │   ├── ModuleUnavailable.css # NUEVO
│   │   ├── Surface.tsx           # NUEVO — tratamiento de tarjeta/superficie (lenguaje visual, sin datos)
│   │   ├── StatusBadge.tsx       # NUEVO — estado con color + icono + texto (nunca solo color — FR-039)
│   │   ├── Brand.tsx             # NUEVO — símbolo de marca + nombre "IDAF"; compartido por Login y AppShell
│   │   └── icons/
│   │       ├── index.tsx         # NUEVO — mapa IconName → componente SVG; <Icon name/> con title/aria
│   │       └── paths.ts          # NUEVO — datos de trazado de los ~16 iconos (una rejilla 24, un grosor de trazo); incluye status-ok/-warn/-error/-info
│   ├── content/
│   │   └── idaf.ts               # MODIFICADO — + textos de Login, error de credenciales, contexto de sesión, descripciones de área, asociación área→icono
│   └── styles/
│       ├── tokens.css            # NUEVO — custom properties: color de identidad, neutros, semánticos; tipografía; espaciado; radios; foco. Un tema; hook para tema alterno.
│       └── base.css              # NUEVO — reset ligero, tipografía base, landmarks, :focus-visible global
├── tests/
│   ├── unit/
│   │   ├── auth-service.test.ts          # (entorno node) FR-003..FR-007, FR-052, FR-055, FR-056: catálogo scrypt; válidas→identidad; inválidas/usuario inexistente→401 idéntico; fallo interno→503 (no 401); ciclo de sesión (crear/consultar/destruir); no registra credenciales
│   │   ├── auth-client.test.ts           # (fetch mockeado) login() POST → {ok:true,user} | {ok:false, reason}; 401/400→invalid_credentials; 5xx/red/timeout→unavailable (FR-056); fetchSession() GET; logout() POST; nunca otro origen; no guarda secretos
│   │   ├── no-frontend-secrets.test.ts   # NUEVO — FR-055/SC-025: ningún módulo src/ importa server/accounts* ni define hashing/verificación; escaneo de src/ sin patrones de contraseña/hash/sal
│   │   ├── session-provider.test.tsx     # FR-009, FR-011, FR-013, FR-051, FR-057, FR-058: login/logout; rehidratación vía fetchSession + marcador sessionStorage (sin secretos); revalida en visibilitychange/focus→anonymous si authenticated:false; redirige a / con sesión activa
│   │   ├── login-view.test.tsx           # FR-002, FR-004..FR-006, FR-054, FR-056: nombre IDAF + propósito + campos + acción; mensaje invalid_credentials que no dice qué campo falló; mensaje distinto para unavailable; foco al mensaje/formulario al fallar
│   │   ├── require-session.test.tsx      # FR-001, FR-008, FR-010, FR-014: sin sesión→/login; con sesión→contenido; loading no expulsa
│   │   ├── home-view.test.tsx            # MOD — FR-059/SC-030: identidad + propósito + vista general de 7 áreas con estado; sin datos operacionales; ModuleHeader
│   │   ├── primary-nav.test.tsx          # MOD — FR-018..FR-025, SC-031, SC-038: 7 entradas icono+nombre; una familia; activo ≥2 señales (≥1 no cromática); exactamente uno activo; nombre visible si el icono falla; combinación (nombre,icono) única
│   │   ├── visual-criteria.test.tsx      # NUEVO — SC-032/SC-033/SC-034/SC-035, FR-030/FR-042: escaneo de estilos computados: sin gráficos decorativos; transition/animation-duration ≤150ms y iteration-count finito; line-height de contenido ≥1,4; <h1> ≤2× cuerpo; hit-target ≥24×24; huecos verticales sin propósito ≤1,5× ModuleHeader
│   │   ├── session-bar.test.tsx          # FR-012, FR-015, FR-045: identidad visible + "Cerrar sesión"; agrupadas y separadas de la nav; truncado de identificador largo
│   │   ├── module-header.test.tsx        # FR-033: nombre del módulo + descripción opcional consistentes
│   │   ├── module-unavailable.test.tsx   # MOD — FR-043, FR-044: icono+nombre+"No disponible"+explicación; sin button/input/role=button; sin métricas/dispositivos
│   │   ├── status-badge.test.tsx         # FR-039, FR-041: cada estado tiene texto/icono además del color; deshabilitado no aparenta disponible
│   │   ├── registry.test.ts             # MOD — FR-017/FR-019/FR-020/FR-025, SC-038: invariantes previas + cada entrada tiene icon válido; icons de una única familia; combinación (label,icon) única, sin entradas duplicadas
│   │   └── tokens.test.ts                # FR-037, FR-040, FR-042, SC-034, SC-035: existen custom properties de identidad, neutros y 4 familias semánticas; escala tipográfica dentro de límites de densidad (h1 ≤2× cuerpo; line-height cuerpo ≥1,4; --motion-fast ≤150ms)
│   ├── fixtures/
│   │   └── accounts.e2e.json             # NUEVO (IGNORADO por git; lo genera seed-dev-accounts) — cuentas desechables para E2E; nunca se versiona
│   └── e2e/
│       ├── global-setup.ts               # NUEVO — Playwright globalSetup: genera tests/fixtures/accounts.e2e.json (idempotente) antes de cualquier E2E; sin paso manual de auth:seed
│       ├── _session.ts                   # NUEVO — helper loginAs(page, account) reutilizado por todos los E2E
│       ├── auth-login.spec.ts            # US1: sin sesión→Login; válidas→Inicio; inválidas→mensaje genérico; vacíos→mensaje; servicio detenido→mensaje "no se pudo verificar" distinto, sin sesión (FR-056/SC-027); /login con sesión→Inicio sin cerrar sesión (FR-057/SC-028) (SC-001..SC-003)
│       ├── session-logout.spec.ts       # US4: identidad + "Cerrar sesión" desde las 7 áreas en <5s; logout→Login (servicio invalida la sesión); volver a ruta interna→Login (SC-004, SC-008, SC-009)
│       ├── session-persistence.spec.ts  # US7/CL-03/CL-04/CL-08: recarga con sesión conserva sección; recarga sin sesión→Login; vaciar sessionStorage (cierre de pestaña) →Login (SC-005, SC-024)
│       ├── multi-tab-logout.spec.ts     # NUEVO — FR-058/CL-11: dos contextos sobre la misma sesión; logout en uno → el otro muestra /login al reactivarse y al recargar (SC-029)
│       ├── nav-icons-active.spec.ts      # US3: 7 áreas icono+nombre; una familia; exactamente una activa; activo ≥2 señales ≥1 no cromática (perceptible en acromatopsia); alternancia rápida sin doble activo ni contenido duplicado (SC-010..SC-013, SC-031)
│       ├── product-identity.spec.ts      # US2 (Login + Inicio): marca IDAF + símbolo; misma identidad; zonas distinguibles; Login con brand+propósito+mismos componentes de botón/error, sin adornos; FR-027 (a)-(c) aquí, (d)/(e) diferidos a US5 (SC-006, SC-007, SC-017, SC-036, SC-037)
│       ├── home-overview.spec.ts         # NUEVO — FR-059/SC-030: Inicio muestra identidad + propósito + vista general de 7 áreas con estado; sin datos; nav principal visible
│       ├── unavailable-modules.spec.ts   # US6: las 6 vistas conservan identidad; icono+nombre+"No disponible"+explicación; cero elementos simulados (SC-014); SC-032..SC-035 sobre las 6 vistas
│       ├── structure-consistency.spec.ts # US5 (Inicio + el shell): las 4 zonas (nav/identidad/sesión/contenido) estables; encabezado consistente; contenido = mayor superficie; consistencia de los componentes finalizados en US5 (mismo token/componente/regla); runtime SC-032..SC-035 sobre Inicio y el chrome del shell (SC-017/SC-018)
│       ├── global-consistency.spec.ts    # NUEVO — Polish (T089): pasada final tras US5+US6 — FR-036 (9 aspectos) sobre las 7 áreas con divergencia global = 0 (SC-019) + SC-032..SC-035 sobre las 7 vistas + Login
│       ├── keyboard-a11y.spec.ts         # FR-054: form de acceso (+ toggle contraseña) + 7 entradas + "Cerrar sesión" + acciones de error de sección operables por teclado; foco visible; landmarks; foco al iniciar, al cerrar y al fallar el login (SC-022)
│       ├── no-frontend-secrets.spec.ts   # NUEVO — SC-025: escaneo del dist/ construido sin contraseñas/hashes/sales/verificador ni catálogo
│       ├── unknown-route.spec.ts         # MOD — FR-053: con sesión, ruta desconocida→Inicio sin error; sin sesión, ruta protegida→Login (SC-023)
│       └── edge-cases.spec.ts            # US7: identificador de ≥40 car. no rompe estructura; error de ≥200 car. no se superpone; ancho 1024px mantiene nav/sesión/logout (SC-020, SC-021)
└── public/                              # Activos estáticos (favicon)
```

**Structure Decision**: Se conserva el proyecto único en la raíz del repositorio,
con las tres capas del frontend de la SPEC 001 y **dos incorporaciones**:

1. **`src/app/`** — el *núcleo* de la cáscara: shell con landmarks, router (ahora
   con zona pública y zona protegida) y vistas de error. No conoce ningún área
   concreta.
2. **`src/auth/`** — **capa nueva y aislada** del cliente de acceso:
   `authClient` (único módulo que habla con el servicio, sólo HTTP: sin hash, sin
   catálogo, sin verificador), `SessionProvider`/`useSession` (estado de sesión +
   marcador no sensible en `sessionStorage` + rehidratación contra el servicio). El
   resto de la aplicación depende sólo de `useSession` y del guardián
   `RequireSession`.
3. **`server/`** — **servicio de autenticación mínimo** (Node 20, ESM, sólo
   módulos nativos): recibe usuario + contraseña, valida contra el catálogo
   predefinido (hash `scrypt` con sal, catálogo obtenido en tiempo de ejecución
   desde fuera del repositorio) y devuelve el resultado + la identidad mostrada;
   mantiene la sesión del lado del servidor (cookie `HttpOnly`). No tiene ninguna
   otra responsabilidad: no es un sistema de administración de usuarios.
4. **`src/modules/<area>/`**, **`src/components/`**, **`src/content/`** y
   **`src/styles/`** — igual que en la SPEC 001, más `src/modules/login/`, la
   presentación compartida nueva, la fuente única de terminología y la **fuente
   única de tokens de diseño**.

El servicio se mantiene **deliberadamente mínimo** para no convertir la SPEC 002 en
un sistema de gestión de identidades (spec §Out of Scope). Su contrato HTTP
(usuario+contraseña → resultado + identidad; cookie de sesión) es el **punto de
sustitución** para que una spec futura lo reemplace por un proveedor corporativo o
externo (p. ej. OIDC) sin rediseñar la UI ni el shell de IDAF.

## Complexity Tracking

> El Constitution Check **no** registra violaciones. Esta tabla deja constancia,
> para trazabilidad, de dos adiciones deliberadas de estructura respecto a la
> SPEC 001 (que era «solo frontend, sin persistencia»). **Ninguna** es una
> desviación de seguridad: la validación de credenciales ocurre fuera del cliente
> y el frontend no contiene material para autenticar localmente.

| Adición | Por qué se necesita | Alternativa más simple y por qué se rechaza |
|---------|---------------------|---------------------------------------------|
| **Servicio de autenticación mínimo** (proceso Node aparte en `server/`), frente a la estructura «solo frontend» de la SPEC 001. | La spec exige acceso autenticado (US1, FR-001…FR-010, FR-052) con una **frontera real de seguridad**: cualquier verificador o catálogo enviado al bundle del navegador puede inspeccionarse, así que la validación **debe** ocurrir fuera del cliente (Principio VIII; spec §Dependencies). | *Autenticación en el cliente (hash + catálogo en el bundle)*: rechazada — no es una frontera de seguridad; el material de validación queda expuesto. *Adoptar ya un IdP corporativo / OIDC completo*: rechazada — arquitectura anticipada y, de hecho, gestión de identidades, que §Out of Scope excluye. El servicio se acota a 3 endpoints, sin framework, sin base de datos, sólo módulos nativos de Node, y su contrato queda como punto de sustitución por un proveedor externo. |
| **Persistencia de un marcador de sesión no sensible en `sessionStorage`** + cookie de sesión `HttpOnly` del servicio (la SPEC 001 declaraba «sin persistencia»). | FR-051 y CL-08 exigen que la sesión **sobreviva a la recarga** pero **termine al cerrar la pestaña/navegador**. La cookie de sesión del servicio cubre el cierre de navegador; el marcador en `sessionStorage` cubre además el cierre de **pestaña** desde la perspectiva del cliente. | *Sólo estado en memoria del frontend*: rechazada — se pierde en cada recarga y viola FR-009/FR-051. *`localStorage` o cookie legible por script con caducidad larga*: rechazada — sobreviven al cierre de la pestaña/navegador y violarían FR-051/CL-08; además exponen datos en almacenamiento legible. El marcador guarda **sólo** `{ username, displayName }` (sin contraseña, sin hash, sin token portador); la credencial de sesión real es la cookie `HttpOnly`, no accesible por JavaScript. |

---

## Phase 0: Outline & Research

**No quedaron entradas `NEEDS CLARIFICATION`**: la spec, sus clarificaciones
(sesiones 2026-09-07 y 2026-09-08) y sus Assumptions acotan plataforma (escritorio,
ancho mínimo → 1024 px), modelo de cuentas (varias, predefinidas, sin roles),
semántica de sesión (recarga sí, cierre de pestaña no, `/login` con sesión →
Inicio, multi-pestaña tras logout), verificación de acceso no disponible, gestión
del foco al fallar el login, contenido de Inicio, protocolo de evaluación con
personas, criterios visuales objetivos y anclaje explícito del contraste a
WCAG 2.1 AA. Ver [research.md](./research.md) para las decisiones D1–D15 y su
trazado a requisitos.

## Phase 1: Design & Contracts

- [data-model.md](./data-model.md) — entidades **Sesión** (estado de cliente +
  marcador + sesión de servidor), **Credenciales de acceso**, **Cuenta predefinida**
  (configuración del servicio), **Identidad de usuario mostrada**, **Área principal
  (módulo)** (ahora con `icon` y `description`) y **Sistema visual**, con reglas de
  validación y transiciones de estado de la sesión.
- [contracts/auth-and-session.md](./contracts/auth-and-session.md) — contrato HTTP
  del servicio de autenticación (endpoints, cuerpos, códigos, cookie), API de
  `authClient`, API de `SessionProvider`/`useSession`, comportamiento de
  `RequireSession`, forma y origen del catálogo de cuentas, y contrato de
  sustitución por un proveedor externo.
- [contracts/navigation-and-routes.md](./contracts/navigation-and-routes.md) —
  zona pública vs. protegida, tabla de rutas derivada del registro, reglas del
  estado activo (≥ 2 señales), ruta desconocida con y sin sesión (FR-053).
- [contracts/visual-system.md](./contracts/visual-system.md) — catálogo de tokens
  (roles de color, tipografía, espaciado, radios, foco), contrato de la familia de
  iconos, superficies/tarjetas, encabezado de módulo y matriz de estados de
  interacción, con los criterios verificables (contraste AA, independencia del
  color).
- [quickstart.md](./quickstart.md) — puesta en marcha (servicio + frontend, `.env`,
  fixtures de desarrollo), comandos de prueba y checklist de validación manual
  mapeada a SC-001…SC-038.

**Actualización 2026-09-08 (cierre de la puerta de calidad de criterios de éxito)**:
la revisión del checklist `checklists/success-criteria.md` detectó términos
objetivados (FR-021, FR-027, FR-029, FR-030, FR-042) sin criterio de éxito medible
y la rúbrica humana incompleta. Se añaden **SC-031…SC-038** a la spec
(FR-021→SC-031; FR-030→SC-032/SC-033/SC-034; FR-042→SC-035 + SC-034; FR-027→SC-036;
FR-029→SC-037; FR-025→SC-038), un umbral objetivo de «divergencia» en SC-019, y la
sección «Evaluación con personas» se hace normativa (cribado del panel, preguntas
literales, rúbrica de SC-007, «expresa duda» observable, material mostrado, tabla
de medición de tiempos de SC-002/SC-008/SC-010 y política de re-test). Cobertura de
pruebas: `visual-criteria.test.tsx` (nuevo, US2 sobre Login + Inicio),
`structure-consistency.spec.ts` (US5, Inicio + shell), `unavailable-modules.spec.ts`
(US6, las 6 vistas «No disponible»), `global-consistency.spec.ts` (nuevo, pasada
final en Polish sobre las 7 áreas con divergencia global = 0),
`nav-icons-active.spec.ts`, `product-identity.spec.ts`, `primary-nav.test.tsx`,
`registry.test.ts`, `tokens.test.ts`. Sin dependencias nuevas; sin cambios en la
Constitución (los SC nuevos son de verificación, no de capacidad).
