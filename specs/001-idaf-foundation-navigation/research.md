# Fase 0 — Investigación y decisiones técnicas

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Regla aplicada en todo el documento (instrucción de planificación): *ante varias
alternativas válidas, se elige la más simple que satisface los requisitos actuales y
permite una evolución razonable*. No se añade arquitectura anticipada para specs
futuras.

No quedaron entradas `NEEDS CLARIFICATION`: la spec y sus Assumptions acotan
plataforma (escritorio/navegador), ausencia de persistencia, ausencia de sistemas
externos y estado de disponibilidad fijo.

---

## D1 — Tipo de aplicación y arquitectura general

- **Decisión**: Aplicación de página única (SPA) solo frontend, empaquetada como
  bundle estático. Sin backend, sin base de datos, sin capa de servicios de red.
- **Rationale**: FR-023 (sin autenticación), FR-019/FR-026 (sin datos ni operaciones),
  Assumptions (sin sistemas externos, sin persistencia). Todo lo que la spec pide es
  presentación y navegación en el cliente. Un backend no aporta nada a ningún FR y
  sería arquitectura anticipada.
- **Relación con la spec**: FR-001–FR-025, todos los Success Criteria.
- **Alternativas consideradas**:
  - *App con backend (API + SPA)*: rechazada — ningún requisito necesita servidor;
    duplica superficie de despliegue y pruebas.
  - *Sitio multi-página con recarga por navegación*: rechazada — choca con FR-011
    ("sin recargar ni reiniciar"), FR-014 (seguir respondiendo al alternar rápido) y
    el edge case de alternancia rápida.
  - *App de escritorio (Electron/Tauri)*: rechazada — Assumptions fija "escritorio/
    navegador estándar"; empaquetar un runtime nativo es complejidad sin requisito.

## D2 — Lenguaje y framework de UI

- **Decisión**: TypeScript + React 18.
- **Rationale**: React es el estándar más difundido para SPAs con navegación y
  composición de vistas; TypeScript hace verificables en compilación las invariantes
  del registro de módulos (unión de estados, exactitud de las 7 áreas). Ecosistema de
  pruebas maduro (RTL, Playwright) para cubrir los criterios de aceptación.
- **Relación con la spec**: habilita FR-007/FR-013/FR-014 (identidad de vista estable,
  sin duplicación) mediante el modelo de componentes y reconciliación de React.
- **Alternativas consideradas**:
  - *Vue / Svelte*: válidas y también simples; se elige React por familiaridad de
    ecosistema y herramientas de testing, sin que ello añada complejidad.
  - *JavaScript sin tipos*: rechazada — se pierde la verificación estática de las
    invariantes del registro (Principio V / FR-006).
  - *HTML + JS a mano*: rechazada — reimplementar routing, límites de error y estado
    activo de navegación es más código y más frágil que usar el router.

## D3 — Empaquetador / tooling de build

- **Decisión**: Vite 5.
- **Rationale**: cero configuración para React + TS, servidor de desarrollo rápido,
  build estático directo, e integra Vitest para pruebas. Es la opción más simple del
  ecosistema React actual.
- **Alternativas consideradas**: Create React App (en desuso), Webpack manual (config
  extensa). Ambas rechazadas por complejidad/mantenimiento superior sin beneficio.

## D4 — Navegación y enrutado

- **Decisión**: React Router 6 (`react-router-dom`) con rutas **derivadas del registro
  de módulos**. Un `AppLayout` con navegación principal persistente y un `<Outlet/>`
  para la vista activa. Ruta índice `/` → Inicio. Una ruta por área
  (`/inventario`, `/descubrimiento`, …). Ruta comodín `*` → **redirección a Inicio**
  (`<Navigate to="/" replace />`).
- **Rationale**:
  - Navegación persistente sin recarga y cambio directo entre cualquier par de áreas:
    el layout es padre de todas las rutas → **FR-008, FR-010, FR-011, US2**.
  - URL por área → una **recarga** o un **acceso directo por URL** dejan al usuario en
    esa misma área con la navegación disponible → **FR-027**, EC-06 "recarga estando
    en un módulo".
  - Ruta comodín que redirige a Inicio → **FR-022** y EC-05 "ruta / destino
    desconocido" sin error crudo y sin superficie de UI adicional.
  - `NavLink` provee el estado "activo" para resaltar el área actual (FR-029) y es un
    `<a>` nativamente enfocable/activable por teclado (FR-028).
- **Relación con la spec**: FR-008–FR-012, FR-022, FR-027, SC-002, SC-003.
- **Modo de historial**: `BrowserRouter` (rutas limpias). Para cumplir **FR-027**
  (recarga / acceso directo conservan el área) requiere que el hosting sirva
  `index.html` en cualquier ruta (fallback SPA); se documenta en quickstart. Si el
  hosting objetivo no lo permitiera, `HashRouter` es sustituto directo sin cambios de
  código de vistas y también satisface FR-027.
- **Alternativas consideradas**:
  - *Router propio basado en `useState`*: rechazada — no da URL por módulo, por lo que
    la recarga perdería el estado y habría que reconstruir manejo de "ruta
    desconocida" y estado activo a mano.
  - *TanStack Router / Next.js*: rechazadas — más potentes pero más superficie
    conceptual de la necesaria; Next.js además presupone servidor.

## D5 — Representación de las siete áreas funcionales (registro de módulos)

- **Decisión**: un único módulo `src/modules/registry.ts` que exporta un array
  ordenado de `FunctionalArea`:
  `{ id, path, label, order, status: 'available' | 'unavailable', Component }`.
  El único texto de estado visible es **"No disponible"** (para las seis áreas
  pendientes); "Disponible" para Inicio. No se usa "Próximamente".
  De este array se derivan, sin repetir la lista en ningún otro sitio:
  1. las entradas de `PrimaryNav`;
  2. la lista de áreas con estado en `HomeView`;
  3. las rutas de `router.tsx`.
- **Rationale**:
  - **FR-006** (exactamente estas 7, en este orden) y **FR-007 / FR-025** (una sola
    entrada por capacidad, etiqueta idéntica en Inicio y navegación) se vuelven
    **estructurales**: hay una sola lista y una sola etiqueta por área.
  - **Principio V (modularidad/extensibilidad)** y el requisito de "separación
    suficiente": añadir Inventario real en una spec futura = cambiar
    `status` y `Component` de una entrada; la navegación, el router y Inicio no se
    tocan.
  - Una prueba unitaria sobre el registro fija las invariantes (SC-001).
- **Relación con la spec**: FR-004, FR-006, FR-007, FR-015, FR-025, SC-001, SC-004.
- **Alternativas consideradas**:
  - *Lista de navegación y lista de Inicio por separado*: rechazada — permite
    divergencia de orden/etiqueta y viola FR-025 con facilidad.
  - *Descubrimiento dinámico de módulos por convención de carpetas*: rechazada —
    magia innecesaria para 7 áreas fijas; el array explícito es más legible y
    verificable.

## D6 — Comportamiento de las vistas de módulos no disponibles

- **Decisión**: un componente compartido `ModuleUnavailable` que recibe el nombre del
  área y renderiza: título con el nombre del módulo + párrafo explícito de que la
  funcionalidad aún no está disponible y se incorporará en una versión posterior.
  **Sin** botones, campos, ni controles accionables. Cada carpeta de módulo pendiente
  expone una vista mínima (`InventoryView`, etc.) que solo delega en
  `ModuleUnavailable` con su etiqueta tomada del registro.
- **Rationale**:
  - **FR-016** (indicación explícita de "pendiente"), **FR-017** (sin acciones
    falsas), **FR-018** (ni vacío, ni error, ni información técnica): un único
    componente controlado garantiza consistencia y hace imposible introducir un botón
    "Escanear red" por descuido en un módulo suelto.
  - Vista por carpeta desde ya → cada spec futura tiene un punto de anclaje claro
    (US3 Assumption: "vista propia" = pantalla identificable, sin estructura interna
    adicional).
  - Refuerza el principio de honestidad citado por la propia US3 ("nada debe
    aparentar funcionar").
- **Relación con la spec**: FR-015–FR-019, US3, SC-004.
- **Alternativas consideradas**:
  - *Una sola ruta genérica `/proximamente` para los seis*: rechazada — incumple
    FR-012 (vista identificada con el nombre del área) y FR-015 (vista propia
    accesible por área) y complicaría el reemplazo módulo a módulo.
  - *Placeholder con botón "Notificarme"/"Volver"*: rechazada — "Volver" es
    redundante con la navegación persistente; cualquier control roza FR-017.

## D7 — Navegación entre módulos (transiciones y estabilidad)

- **Decisión**: la navegación es un cambio de ruta del cliente; React desmonta la
  vista anterior y monta la nueva bajo el mismo `<Outlet/>`. Selección del área activa
  vía `NavLink`. No se implementa animación de transición ni caché de vistas montadas.
- **Rationale**:
  - **FR-013** (reselección del área activa sin error ni duplicado): navegar a la
    ruta ya activa es idempotente en React Router; además `HomeView` y
    `ModuleUnavailable` son componentes puros sin efectos acumulativos.
  - **FR-014** y EC-02 (alternancia rápida, ≥ 20): al no cachear vistas ni encadenar
    temporizadores, solo hay una vista montada a la vez — la de la última ruta.
  - EC-02 "estados intermedios pegados": sin transiciones asíncronas no hay
    estado intermedio que se quede fijo.
- **Relación con la spec**: FR-012, FR-013, FR-014, EC-01, EC-02, SC-006, SC-007.
- **Alternativas consideradas**:
  - *`React.lazy` + `Suspense` por módulo (code-splitting)*: aplazada — introduce un
    estado de carga por módulo y su edge case; con 6 placeholders triviales el peso
    es despreciable. Se puede añadir sin rehacer navegación cuando un módulo futuro
    lo justifique.
  - *Mantener vistas montadas y ocultarlas*: rechazada — acumula DOM y estado, justo
    lo que los edge cases piden evitar.

## D8 — Rutas o destinos desconocidos

- **Decisión**: ruta comodín `path="*"` que **redirige directamente a Inicio**
  (`<Navigate to="/" replace />`). No se crea ninguna vista funcional `NotFound`. El
  reemplazo del historial (`replace`) evita que el botón "atrás" vuelva a la ruta
  inválida.
- **Rationale**: **FR-022** admite explícitamente "lo lleve a Inicio **o** muestre un
  mensaje". Redirigir es la opción más simple: cero superficie de UI nueva, cero texto
  que mantener, imposible mostrar un error crudo. El usuario acaba en un estado válido
  con la navegación principal visible (Inicio vive dentro del `AppLayout`).
- **Relación con la spec**: FR-022, edge case "ruta/destino desconocido".
- **Alternativas consideradas**:
  - *Vista `NotFound` con mensaje y botón a Inicio*: rechazada — también cumple
    FR-022 pero añade un componente, texto y una prueba propios sin beneficio para el
    usuario, que en la práctica solo quiere volver a un estado conocido.

## D9 — Manejo de errores visibles al usuario

- **Decisión**: dos niveles, ninguno muestra traza técnica en la UI:
  1. **`errorElement` de React Router** (`RouteError.tsx`) para fallos al resolver o
     renderizar una ruta: mensaje comprensible de que "no se pudo mostrar esta
     sección" + dos salidas: **Reintentar** (revalida/re-navega) y **Volver a Inicio**.
  2. **Error boundary raíz** en `App.tsx` como red de seguridad para errores fuera del
     árbol de rutas: misma vista amigable con acción "Volver a Inicio".
  Los detalles del error se envían a `console.error` para depuración, nunca al DOM
  visible.
- **Rationale**: **FR-020** (nada de trazas/mensajes internos durante uso normal),
  **FR-021** (mensaje comprensible + salida: volver a Inicio o reintentar; "Reintentar"
  reintenta la ruta actual y, si vuelve a fallar, permanece el mensaje), EC-04 "fallo
  al mostrar una sección" y EC-03 "módulo sin funcionalidad" (que nunca se presente
  como error). SC-006 (recorrido normal sin ningún error técnico visible).
- **Relación con la spec**: FR-020, FR-021, EC-03, EC-04, SC-006.
- **Alternativas consideradas**:
  - *Solo error boundary de React*: rechazada — no captura errores de resolución de
    ruta de forma tan limpia como `errorElement`; usar ambos es poco código y cubre
    los dos orígenes.
  - *Mostrar `error.message`*: rechazada — puede filtrar información técnica interna
    (FR-018, FR-020).

## D10 — Fuente única de terminología y textos

- **Decisión**: `src/content/idaf.ts` centraliza: nombre de producto ("IDAF"), texto
  de propósito, las siete etiquetas de área, los dos textos de estado ("Disponible",
  "No disponible"), el mensaje de "funcionalidad pendiente" y el texto de "error de
  sección". El registro de módulos importa las etiquetas desde aquí; `HomeView` y
  `PrimaryNav` no llevan texto de área embebido. No hay texto de "destino desconocido"
  porque esos casos redirigen a Inicio (D8).
- **Rationale**: **FR-002, FR-003, FR-025** (terminología idéntica en Inicio y
  navegación) y **Principio XI** (fuente de verdad consistente) a escala de textos.
  Assumption: el texto exacto puede ajustarse sin cambiar el significado → tenerlo en
  un solo archivo facilita ese ajuste.
- **Relación con la spec**: FR-002, FR-003, FR-005, FR-025, SC-005.

## D11 — Persistencia y estado

- **Decisión**: sin `localStorage`, sin cookies, sin estado global persistente. El
  único "estado" es la URL actual (gestionada por el router). Cada apertura de la
  aplicación en `/` muestra Inicio.
- **Rationale**: Assumptions de la spec ("no hay persistencia de estado de usuario ni
  preferencias"; "cada apertura parte de la pantalla de Inicio").
- **Relación con la spec**: Assumptions; no contradice ningún FR.

## D12 — Estrategia de pruebas

- **Decisión**: dos capas.
  - **Unitarias / de componente** (Vitest + React Testing Library + jsdom):
    - `registry.test.ts`: exactamente 7 áreas, orden exacto de FR-006, `id`/`label`
      únicos, solo `home` con `status: 'available'` → SC-001, SC-004 (parte).
    - `home-view.test.tsx`: aparece "IDAF"; hay texto de propósito con los cuatro
      conceptos (descubrimiento, gestión, diagnóstico, observabilidad); se listan las
      7 áreas con su estado → FR-001..FR-005, SC-001.
    - `primary-nav.test.tsx`: 7 enlaces, una vez cada uno, en orden; etiquetas
      idénticas a las de Inicio (mismo origen) → FR-006, FR-007, FR-009, FR-025.
    - `module-unavailable.test.tsx`: muestra el nombre del módulo y el mensaje de
      pendiente; **no** hay `button`, `input`, ni `role="button"` → FR-016..FR-018,
      SC-004.
    - `route-error.test.tsx`: al forzar un throw en una vista, se ve el mensaje
      amigable y las acciones Reintentar / Volver a Inicio; no aparece el texto del
      error técnico → FR-020, FR-021.
  - **End-to-end** (Playwright, navegador real):
    - `navigation.spec.ts`: desde cada área se alcanza cualquier otra en un paso, sin
      pasar por Inicio; volver a Inicio en un paso; sin recarga de documento
      (`page` no dispara `load`) → US2, FR-010, FR-011, SC-002, SC-003.
    - `repeat-and-rapid.spec.ts`: seleccionar el área activa 10 veces → sin error, un
      solo encabezado de vista; alternar 20+ veces rápido → queda solo la última
      área, sin errores de consola → FR-013, FR-014, SC-006, SC-007.
    - `reload.spec.ts`: estando en `/topologia`, recargar → sigue en Topología (o
      Inicio) con navegación visible → edge case "recarga estando en un módulo".
    - `unknown-route.spec.ts`: ir a `/no-existe` → la app redirige a `/` (Inicio) con
      la navegación visible; nunca un error crudo → FR-022.
  - **Verificación manual guiada**: checklist en `quickstart.md` que mapea CA-01…CA-12
    y SC-005 (comprensión del usuario en < 3 min) a pasos ejecutables → SC-008.
- **Rationale**: los FR de contenido y estructura se verifican barato y rápido en la
  capa de componente; los criterios que dependen de un navegador real (recarga, URL,
  ausencia de recarga de documento, operación por teclado, foco visible, errores de
  consola en sesión larga) requieren E2E. SC-005 es de juicio humano y **no
  bloqueante**; SC-008 (CA-01…CA-12, ya incorporados a `spec.md`) se valida con
  checklist manual y es bloqueante.
- **Relación con la spec**: cubre FR-001–FR-031 (partes automatizables) y
  SC-001–SC-008.
- **Alternativas consideradas**:
  - *Solo E2E*: rechazada — lento y con peor localización de fallos para asserts de
    contenido.
  - *Solo unitarias*: rechazada — no puede validar recarga, URL real ni consola.
  - *Cypress en vez de Playwright*: equivalente; se elige Playwright por
    multi-navegador nativo y menor configuración.

## D13 — Accesibilidad mínima de la navegación

- **Decisión**: la navegación principal es un `<nav>` con `NavLink`s (elementos `<a>`
  nativamente enfocables y activables por teclado). El área activa se marca con
  `aria-current="page"` además del estilo visual. Se define un estilo `:focus-visible`
  explícito para el foco de teclado. El nombre accesible de cada entrada es su propia
  etiqueta de texto, tomada de `content/idaf.ts`.
- **Rationale**: cumple **FR-028–FR-031** con el mínimo imprescindible y sin
  dependencias nuevas; `react-router` ya provee el estado activo. No se añade gestión
  de foco programática, *skip-links* ni auditoría WCAG (fuera de alcance, spec §Out of
  Scope).
- **Relación con la spec**: FR-028, FR-029, FR-030, FR-031; contrato C10.
- **Alternativas consideradas**:
  - *`<div role="navigation">` con manejadores `onClick`*: rechazada — reimplementa el
    foco y la activación por teclado que `<a>` da gratis; más frágil.
  - *Librería de accesibilidad / design system accesible*: rechazada — desproporcionada
    para 7 enlaces; añade peso sin requisito.

---

## Resumen de decisiones

| ID | Decisión | Requisitos que ancla |
|----|----------|----------------------|
| D1 | SPA solo frontend, bundle estático | FR-023, FR-026, Assumptions |
| D2 | TypeScript + React 18 | FR-007, FR-013, FR-014 |
| D3 | Vite 5 | (tooling) |
| D4 | React Router 6, layout persistente, ruta comodín | FR-008–FR-012, FR-022, FR-027, SC-002/003 |
| D5 | Registro único de módulos | FR-004, FR-006, FR-007, FR-015, FR-025, SC-001 |
| D6 | Componente `ModuleUnavailable` compartido, vista por carpeta | FR-015–FR-019, US3, SC-004 |
| D7 | Navegación = cambio de ruta, sin caché ni animación | FR-012–FR-014, EC-01, EC-02, SC-006/007 |
| D8 | Ruta comodín → redirección a Inicio (sin vista `NotFound`) | FR-022, EC-05 |
| D9 | `errorElement` + error boundary raíz, sin trazas en UI | FR-020, FR-021, EC-03, EC-04, SC-006 |
| D10 | Fuente única de textos y etiquetas | FR-002, FR-003, FR-005, FR-025 |
| D11 | Sin persistencia | Assumptions |
| D12 | Vitest+RTL (componente) + Playwright (E2E) + checklist manual | FR-001–FR-031, SC-001–SC-008 |
| D13 | Accesibilidad mínima de la navegación (`NavLink` + `aria-current` + `:focus-visible`) | FR-028–FR-031, C10 |
