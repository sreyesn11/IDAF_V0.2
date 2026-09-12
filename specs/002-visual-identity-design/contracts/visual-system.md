# Contrato — Sistema visual

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md) · **Research**: [../research.md](../research.md) (D6, D7, D10–D13)

Contrato de las decisiones de identidad reutilizadas en el acceso y en toda la
aplicación. Los **valores exactos** (hex, px) los fija la implementación; este
documento fija los **roles, la estructura y los criterios verificables**. Ningún
valor hexadecimal es normativo aquí (FR-050).

---

## 1. Tokens de diseño — `src/styles/tokens.css`

Todas las declaraciones de color, tipografía y espaciado de los componentes pasan
por estas custom properties. **Ningún componente** usa un color literal fuera de
`tokens.css` (habilita `[data-theme]` futuro sin refactor — Assumptions).

### 1.1 Color — roles (FR-037, FR-038)

| Grupo | Tokens (nombres orientativos) | Significado fijo entre módulos |
|-------|------------------------------|-------------------------------|
| Identidad | `--color-identity`, `--color-identity-strong`, `--color-identity-contrast` | marca, navegación, selección, foco, información de identidad |
| Neutros | `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-text`, `--color-text-muted` | fondos, superficies/tarjetas, bordes, texto principal y secundario |
| Semántico — correcto | `--color-ok`, `--color-ok-bg`, `--color-ok-text` | correcto / disponible / conectado |
| Semántico — advertencia | `--color-warn`, `--color-warn-bg`, `--color-warn-text` | advertencia / atención |
| Semántico — error | `--color-error`, `--color-error-bg`, `--color-error-text` | error / fallo / desconectado |
| Semántico — info | `--color-info`, `--color-info-bg`, `--color-info-text` | información / neutro-informativo |

- **V1** — el significado de cada familia semántica **no cambia** entre módulos
  (FR-038; SC-019).
- **V2** — se define **una** paleta (tema definitivo). La estructura permite añadir
  `:root[data-theme="…"]` redefiniendo sólo estos tokens, sin tocar componentes
  (Assumptions).

### 1.2 Tipografía (FR-036, FR-042)

| Token | Uso |
|-------|-----|
| `--font-family` | una sola familia — stack del sistema (`system-ui, …`); sin webfont (sin dependencia, sin FOUT) |
| `--font-size-100..700` + `--line-height-*` | escala contenida; el `<h1>` de módulo ≤ ~2× el tamaño del texto de cuerpo y el `line-height` del cuerpo ≥ 1,4 (límites de FR-042) |
| `--font-weight-regular`, `--font-weight-medium`, `--font-weight-bold` | `bold` reservado para el estado activo y títulos |

### 1.3 Espaciado, radios, foco, densidad (FR-030, FR-041, FR-042)

| Token | Uso |
|-------|-----|
| `--space-50..800` | escala de espaciado. Límites verificables de FR-042 (**SC-035**): dentro del área de contenido visible, ningún hueco vertical continuo sin contenido y sin propósito > 1,5× la altura del `ModuleHeader`; el área activa (*hit target*) de todo control interactivo ≥ 24×24 px |
| `--radius-sm`, `--radius-md` | superficies, botones, campos, badges |
| `--focus-ring` | contorno de `:focus-visible`: ≥ 3 px, contraste ≥ 3:1 con su fondo (FR-040), `outline-offset` ≥ 2 px (FR-041, FR-054; SC-022) |
| `--motion-fast` | única duración de transición permitida para microcambios de estado: ≤ 150 ms; sin animaciones en bucle ni decorativas — `animation-iteration-count` finito (FR-030; **SC-033**) |
| `--font-size` / `--line-height` de cuerpo | `line-height` de todo texto de contenido ≥ 1,4; `<h1>` de módulo ≤ 2,0× el `font-size` de cuerpo (FR-030(d), FR-042; **SC-034**, **SC-035**) |
| `--layout-min-width: 1024px` | ancho mínimo soportado (research D14; FR-046) |

Además (FR-030; **SC-032**): ninguna vista de Login ni de las 7 áreas incluye
imágenes, ilustraciones o gráficos puramente decorativos que compitan con la
información funcional — todo `<img>` / `background-image` / `<svg>` / `<canvas>` es
funcional (marca, iconos de navegación/UI/estado) o no existe. El área de contenido
del módulo es la región de mayor superficie (FR-034; SC-018).

### 1.4 Criterio verificable de contraste (FR-040 = SC-016)

FR-040 fija el mismo umbral que SC-016: **WCAG 2.1 AA**. Cumplen AA los pares:

| Par | Ratio mínimo |
|-----|--------------|
| `--color-text` sobre `--color-bg` y sobre `--color-surface` | 4.5:1 |
| `--color-text-muted` sobre su fondo | 4.5:1 (texto normal) / 3:1 si es texto grande |
| texto de entrada de nav **activa** vs. **inactiva** (y su fondo) | 3:1 (componente) |
| texto de `<button>` sobre su superficie | 4.5:1 |
| borde/relleno de estados normal / advertencia / error entre sí y con el fondo | 3:1 |
| `--focus-ring` sobre los fondos donde aparece | 3:1 |

Verificación: checklist manual en `quickstart.md` + comprobación opcional con
axe-core ejecutado en el navegador de pruebas (no se añade como dependencia del
proyecto).

## 2. Familia de iconos — `src/components/icons/`

1. **I1 — Una sola rejilla y trazo.** Todos los iconos: `viewBox="0 0 24 24"`,
   `fill="none"`, `stroke="currentColor"`, `stroke-width` constante,
   `stroke-linecap`/`stroke-linejoin` constantes. Un único `paths.ts`. (FR-020;
   SC-013.)
2. **I2 — API.**

   ```tsx
   type IconName =
     | 'home' | 'inventory' | 'discovery' | 'connections'
     | 'diagnostics' | 'topology' | 'observability'      // navegación (FR-019)
     | 'brand'                                            // símbolo de marca (FR-028)
     | 'user' | 'logout'                                  // contexto de sesión
     | 'status-ok' | 'status-warn' | 'status-error' | 'status-info' // badges (FR-039)
     | 'password-show' | 'password-hide';                 // login

   function Icon(props: {
     name: IconName;
     title?: string;        // si se pasa → role="img" + <title>; si no → aria-hidden="true"
     className?: string;
   }): JSX.Element;
   ```

3. **I3 — Decorativo por defecto.** En `PrimaryNav`, `SessionBar`,
   `ModuleUnavailable` el icono acompaña a texto visible → `aria-hidden="true"`
   (el nombre accesible lo da el texto). `title` sólo cuando el icono va solo
   (p. ej. el toggle de contraseña, que además tiene `aria-label`). (FR-018,
   FR-024, FR-054.)
4. **I4 — Conceptos** (FR-019): ver tabla en
   [../data-model.md](../data-model.md) §5.
5. **I5 — Símbolo de marca.** `name="brand"` es un símbolo **original y sencillo**
   de nodos/conectividad, creado en esta feature (Assumptions; no hay recurso
   previo). Nunca sustituye al texto «IDAF» (FR-028).

## 3. Componentes de presentación — contrato de comportamiento

### 3.1 `Brand`

- Renderiza `<Icon name="brand" aria-hidden />` + `IDAF` (texto).
- Se usa **idéntico** en `LoginView` y en el `<header>` del AppShell → Login y
  aplicación se reconocen como el mismo producto (FR-028, FR-029; SC-006, SC-007).

### 3.2 `ModuleHeader({ title, description? })`

- `<h1 tabIndex={-1}>{title}</h1>` + (si `description`) `<p>`.
- Mismo marcado y tokens en las siete áreas (FR-033, FR-036; SC-019).
- El `<h1>` es el destino de foco tras iniciar sesión (research D5; FR-054).

### 3.3 `SessionBar`

- Componente de presentación (nombre elegido para no confundir con un React
  context; el contexto real es `src/auth/SessionProvider.tsx` / `useSession`).
- Contenedor con `aria-label="Sesión"` dentro del `<header>` (`banner`), separado
  visualmente del `<nav>` (FR-015; SC-009).
- Muestra `<Icon name="user" aria-hidden />` + `displayName`.
- `displayName` largo: `max-width` + `text-overflow: ellipsis` + `title` con el
  valor completo → no desplaza nav ni contenido (FR-045; SC-020).
- `<button type="button">` «Cerrar sesión» con `<Icon name="logout" aria-hidden />`
  + texto; `onClick` → `useSession().logout()` + navegar a `/login`. Es un
  `<button>`, no un enlace de módulo (FR-012, FR-015; SC-008).
- Operable por teclado, con nombre y rol accesibles (FR-054; SC-022).

### 3.4 `Surface`

- Contenedor visual de «unidad independiente de información»: `--color-surface` /
  `--color-surface-raised`, `--color-border`, `--radius-md`, padding de escala.
- **No** define contenido de datos. Deja el lenguaje de tarjeta listo para specs
  futuras **sin** mostrar datos ni métricas ficticias (FR-035; SC-018).

### 3.5 `StatusBadge({ kind, children })`

- `kind ∈ {ok, warn, error, info}` → familia semántica correspondiente.
- **Siempre** combina: color semántico + `<Icon name={`status-${kind}`} aria-hidden />`
  + **texto** (`children`). Nunca sólo color (FR-039; SC-015).
- Forma reconocible (píldora con borde) → distinguible en escala de grises.

### 3.6 `ModuleUnavailable({ areaLabel, icon })` — reescrito

- `<section>` con `ModuleHeader title={areaLabel}`.
- Muestra `<Icon name={icon} title={areaLabel} />` (icono del módulo), un
  `StatusBadge kind="info"` con el texto **«No disponible»** (`idaf.statusText.
  unavailable`) y un `<p>` con la explicación de incorporación futura
  (`idaf.unavailableBody`).
- **Prohibido**: `button`, `input`, `form`, `select`, `role="button"`, enlaces de
  acción, tablas de datos, valores numéricos que parezcan métricas, nombres que
  parezcan dispositivos. La mejora visual **no** hace que la funcionalidad
  inexistente aparente operar (FR-043, FR-044; SC-014).
- Conserva la identidad de IDAF (usa `Brand` vía el shell, tokens, familia de
  iconos) y **no** es una página vacía (FR-044).

### 3.7 `HomeView` — reestilizado (FR-059)

- `<section>` con `ModuleHeader title={idaf.areaLabels.home}` y la explicación
  breve del propósito (`idaf.purpose`).
- **Vista general de las siete áreas** con su estado de disponibilidad
  («Disponible» / «No disponible»), tomada del registro (misma fuente que la
  navegación — FR-025). Puede presentarse como lista o como conjunto de `Surface`;
  es **informativa**: si sus elementos enlazan a las áreas, no sustituye ni oculta
  `PrimaryNav` (FR-031) y no es una segunda navegación.
- **Sin** datos operacionales, métricas ni contenidos simulados (FR-034, FR-059;
  SC-030).

### 3.8 `LoginView`

Ver [auth-and-session.md](./auth-and-session.md) §F (contenido, envío, éxito,
fallo con mensaje `invalid_credentials` vs. `unavailable`, error largo, teclado,
identidad compartida, acceso con sesión activa).

## 4. Matriz de estados de interacción (FR-041; SC-022)

Todo control (entradas de nav, `<button>`, campos del formulario) comunica
**visualmente**:

| Estado | Señal(es) mínimas |
|--------|-------------------|
| normal | color de token base |
| hover | cambio de fondo/borde de token (no es el único indicador de nada funcional) |
| seleccionado / activo | **≥ 2 propiedades visuales renderizadas simultáneamente, de las que ≥ 1 no cromática**: forma (barra/borde de acento) + peso tipográfico; el color de identidad es adicional, nunca la única señal. La(s) señal(es) no cromática(s) siguen distinguiéndose en simulación de acromatopsia (FR-021; **SC-031**, SC-015) |
| foco de teclado | `--focus-ring` visible (`:focus-visible`), contraste ≥ 3:1 con el fondo (FR-040) |
| deshabilitado | opacidad reducida **+** `cursor: not-allowed` **+** `aria-disabled="true"`; **no** aparenta disponible (FR-041) |
| error (campo/formulario) | borde `--color-error` **+** mensaje asociado por `aria-describedby` **+** `role="alert"` en el contenedor del mensaje; el mensaje de acceso usa `idaf.auth.invalidCredentials` (credenciales) o `idaf.auth.unavailable` (verificación no disponible — FR-056), ambos genéricos |

## 5. Estructura y densidad (FR-030, FR-031, FR-032, FR-042)

- Cuatro zonas del AppShell estables entre módulos (ver
  [navigation-and-routes.md](./navigation-and-routes.md) §4).
- Apariencia técnica, limpia y sobria, con los criterios verificables de FR-030:
  sin imágenes/ilustraciones/gráficos puramente decorativos; sólo microtransiciones
  de estado ≤ 150 ms, sin animación en bucle; `<main>` = mayor superficie
  (FR-034; SC-018); interlineado de cuerpo ≥ 1,4.
- Densidad moderada con los límites de FR-042 (§1.2, §1.3): `<h1>` de módulo ≤ ~2×
  el texto de cuerpo; sin huecos verticales continuos sin propósito > ~1,5× la
  altura del `ModuleHeader`; área activa de controles ≥ 24×24 px.
- Consistencia entre las siete áreas (FR-036 = SC-019): mismo tratamiento de
  tipografía, espaciado, estilos de título, comportamiento de navegación,
  iconografía, estados activos, mensajes de error, botones y estructura general.
  **Umbral objetivo de «divergencia» (SC-019)**: para cada uno de los 9 aspectos,
  «mismo tratamiento» = producido por el mismo token de `tokens.css`, el mismo
  componente compartido o la misma regla de `base.css`. Cuenta como **una
  divergencia** cada par (área, aspecto) que se resuelva con un token distinto, un
  componente distinto o un valor codificado directamente que no pase por la fuente
  compartida. Se cumple con divergencias = 0 sobre los 7 × 9 = 63 pares.
- **Evolución perceptible (FR-027; SC-036)**: el resultado presenta, de forma
  conjunta, (a) marca (nombre + símbolo `Brand`), (b) sistema de color con roles
  (§1.1), (c) familia iconográfica única (§2), (d) `ModuleHeader` consistente en
  las 7 áreas (§3.2), (e) tratamiento de superficies/tarjetas (`Surface`, §3.4).
  Falta cualquiera de (a)–(e) ⇒ SC-036 no se cumple.
- **Pantalla de acceso (FR-029; SC-037)**: contiene nombre IDAF + símbolo de marca,
  el texto breve de propósito (red/IoT + diagnóstico/observabilidad), los **mismos
  componentes y tokens** de botón y de mensaje de error que la aplicación interna,
  y **cero** imágenes o adornos puramente decorativos; el formulario no usa un
  estilo distinto al de los controles internos. Ver
  [auth-and-session.md](./auth-and-session.md) §F1/§F7.
- Interfaz en español (FR-049); todos los textos desde `content/idaf.ts` (FR-025,
  **SC-038**; Principio XI). Cada área tiene una única combinación (label, icon) en
  la navegación; sin entradas duplicadas para la misma funcionalidad; la vista
  general de Inicio y `PrimaryNav` derivan de `MODULE_REGISTRY` (fuente única).

## 6. Criterios verificables (resumen para tests)

| # | Criterio | Prueba |
|---|----------|--------|
| VS-1 | Existen los tokens de identidad, neutros y las 4 familias semánticas | `tokens.test.ts` (FR-037) |
| VS-2 | Todos los `area.icon` pertenecen a `icons/paths.ts` (familia única); combinación (label, icon) única, sin entradas duplicadas | `registry.test.ts` (FR-020, FR-025; SC-038) |
| VS-3 | Estado activo de nav con ≥ 2 propiedades renderizadas simultáneas, ≥ 1 no cromática (perceptible en acromatopsia); exactamente una activa por vista | `primary-nav.test.tsx`, `nav-icons-active.spec.ts` (FR-021; SC-031) |
| VS-4 | `StatusBadge` incluye texto + icono además del color | `status-badge.test.tsx` (FR-039) |
| VS-5 | `ModuleUnavailable` sin controles ni datos simulados; con icono + nombre + «No disponible» + explicación | `module-unavailable.test.tsx` (FR-044; SC-014) |
| VS-6 | `ModuleHeader` idéntico en las 7 áreas; misma lista de aspectos que FR-036 | `module-header.test.tsx`; `structure-consistency.spec.ts` (SC-019) |
| VS-7 | Elemento deshabilitado: opacidad + `cursor` + `aria-disabled` | `status-badge.test.tsx` / test de botón |
| VS-8 | Contraste WCAG 2.1 AA en Login y en las 7 áreas | checklist `quickstart.md` + axe opcional (FR-040; SC-016) |
| VS-9 | Percepción sin color: estados y módulo activo siguen distinguibles | checklist `quickstart.md` (SC-015) |
| VS-10 | A 1024 px, nav + sesión + logout visibles y utilizables | `edge-cases.spec.ts` (SC-021) |
| VS-11 | Densidad y movimiento: `<h1>` ≤ 2,0× cuerpo; sin huecos sin propósito > 1,5× `ModuleHeader`; controles ≥ 24×24 px; `line-height` de contenido ≥ 1,4; sin gráficos decorativos que compitan con lo funcional; transiciones/animaciones ≤ 150 ms con `iteration-count` finito | `visual-criteria.test.tsx`; `structure-consistency.spec.ts`; `tokens.test.ts`; checklist `quickstart.md` E15 (FR-030, FR-042; SC-032, SC-033, SC-034, SC-035) |
| VS-12 | Inicio: identidad + propósito + vista general de 7 áreas con estado; sin datos operacionales; nav principal visible | `home-view.test.tsx`; `home-overview.spec.ts` (FR-059; SC-030) |
| VS-13 | FR-027 (a)–(e) presentes de forma conjunta (marca, roles de color, familia de iconos, `ModuleHeader`, superficies) | `product-identity.spec.ts` + checklist `quickstart.md` E7/E9 (FR-027; SC-036) |
| VS-14 | Login: nombre + símbolo, texto de propósito, mismos componentes/tokens de botón y de error que la app interna, sin adornos decorativos, formulario sin estilo distinto | `product-identity.spec.ts`, `login-view.test.tsx` + checklist E7 (FR-029; SC-037) |
