# Contrato — Navegación y rutas (SPEC 002)

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md) · **Research**: [../research.md](../research.md) (D4, D8)

Amplía el contrato de la SPEC 001
([navigation-and-routes.md](../../001-idaf-foundation-navigation/contracts/navigation-and-routes.md))
con la zona pública/protegida y el estado activo con múltiples señales. Todo lo no
contradicho aquí sigue vigente.

---

## 1. Zonas de enrutado

| Zona | Rutas | Guardián | Layout |
|------|-------|----------|--------|
| **Pública** | `/login` | ninguno | sin `AppLayout` (pantalla propia) |
| **Protegida** | `/` (Inicio) y las 6 rutas de área; `*` | `RequireSession` | `AppLayout` (AppShell) persistente |

```text
<RouterProvider>
└── path="/"  element=<RequireSession/>            // D-guardián
    ├── (con sesión) → <AppLayout/>                // header + nav + main
    │   ├── index               → <HomeView/>        (/)
    │   ├── path="/inventario"  → <InventoryView/>
    │   ├── path="/descubrimiento" → <DiscoveryView/>
    │   ├── path="/conexiones"  → <ConnectionsView/>
    │   ├── path="/diagnosticos" → <DiagnosticsView/>
    │   ├── path="/topologia"   → <TopologyView/>
    │   ├── path="/observabilidad" → <ObservabilityView/>
    │   └── path="*"            → <Navigate to="/" replace/>   // FR-053
    └── (sin sesión) → <Navigate to="/login" replace/>        // FR-001/008/010
path="/login" element=<LoginView/>   errorElement=<RouteError/>
```

- Las rutas de área siguen **derivándose de `MODULE_REGISTRY`** (no hay lista
  paralela): `registry.map(...)`, igual que en la SPEC 001. El único añadido es que
  el array resultante se anida bajo `RequireSession`.
- Cada ruta conserva su `errorElement=<RouteError/>`.

## 2. Reglas de transición

| # | Situación | Resultado | Requisitos |
|---|-----------|-----------|------------|
| R1 | Abrir cualquier `/*` protegida sin sesión | `→ /login` (`replace`) | FR-001, FR-008, FR-010; SC-001 |
| R2 | Abrir `/login` **con** sesión activa | `→ /` (`replace`); no se renderiza un segundo formulario ni se cierra la sesión | FR-057; SC-028; CL-10 |
| R3 | `login()` con éxito | `→ /` (`replace`); foco al `<h1>` de Inicio | FR-003; D5 |
| R4 | `logout()` desde cualquier área | `→ /login` (`replace`); foco al campo Usuario | FR-013, FR-014; CL-05 |
| R4b | `logout()` en otra pestaña sobre la misma sesión | la pestaña afectada pasa a `anonymous` al reactivarse (`visibilitychange`/`focus`) o al recargar, y `RequireSession` lleva a `/login` en la siguiente evaluación de ruta | FR-058; SC-029; CL-11 |
| R4c | `login()` falla por verificación no disponible | permanece en `/login`; mensaje distinto del de credenciales incorrectas; sin sesión; foco al mensaje o al formulario | FR-056; SC-027; CL-09 |
| R5 | Con sesión, abrir ruta que no es de las 7 áreas (`/x`) | `→ /` (Inicio), **sin** error ni vista «no encontrado» | FR-053; SC-023; clarificación 2026-09-07 |
| R6 | Sin sesión, abrir ruta desconocida `/x` | `→ /login` (R1 aplica: `/x` está bajo el guardián) | FR-008 |
| R7 | Recargar (`F5`) una ruta interna válida con sesión | permanece en esa ruta con la navegación visible | FR-009; SC-005; CL-03 |
| R8 | Recargar una ruta protegida sin sesión | `→ /login` | FR-010; SC-005; CL-04 |
| R9 | Cerrar pestaña/navegador y reabrir IDAF | `→ /login` (sesión no rehidratable) | FR-051; SC-024; CL-08 |
| R10 | Navegar entre áreas (con sesión) | cambio de ruta de cliente, **sin** recarga de documento; `AppShell` permanece montado | FR-026, FR-031; SC-017 |
| R11 | Reseleccionar el área activa / alternar rápido (≥ 20) | sin error, sin doble activo, sin contenido duplicado; queda montada sólo la última | FR-022, FR-023; SC-011 |

`replace` en R1–R4 impide que «atrás» reingrese a un estado inválido.

## 3. Navegación principal (`PrimaryNav`)

1. **N1 — Origen único.** Renderiza una entrada por cada área de
   `MODULE_REGISTRY`, en orden `order`, exactamente una vez. Etiqueta = `area.label`
   (misma fuente que Inicio — FR-025).
2. **N2 — Icono + nombre.** Cada entrada muestra `<Icon name={area.icon}
   aria-hidden />` **y** el texto `area.label` visible. El nombre nunca se sustituye
   por el icono; si el SVG no pinta, el texto basta para identificar y usar la
   entrada (FR-018, FR-024; SC-012; CL-07).
3. **N3 — Familia única.** Todos los `area.icon` provienen de
   `src/components/icons` (una rejilla, un grosor). Verificado en
   `registry.test.ts` (FR-020; SC-013).
4. **N4 — Estado activo con ≥ 2 propiedades visuales renderizadas simultáneas, de
   las que ≥ 1 es no cromática** (FR-021 revisado; **SC-031**), sobre la entrada
   cuya ruta coincide con la actual:
   - `aria-current="page"` (lo pone `NavLink`);
   - indicador de **forma**: barra/borde de acento sólido *(no cromática)*;
   - **peso tipográfico** distinto (p. ej. 700) *(no cromática)* + color de texto
     de identidad;
   - fondo de superficie elevado.
   FR-021 se cumple con forma + peso tipográfico (ambas no cromáticas), de modo que
   el estado activo se distingue también en la simulación de acromatopsia
   (FR-039; SC-010, SC-015, **SC-031**).
5. **N5 — Exactamente una activa.** Derivado de la ruta única del router; en `/`
   se usa `end` para que Inicio no quede activo en subrutas. En cada una de las 7
   vistas internas: exactamente una entrada activa, cero vistas con ninguna o con
   más de una (FR-022; SC-011, **SC-031**).
6. **N6 — Teclado.** Cada entrada es un `<a>` (`NavLink`), enfocable y activable con
   teclado; `:focus-visible` con anillo de alto contraste (FR-054; SC-022).
7. **N7 — Landmark.** El contenedor es `<nav aria-label={idaf.navAriaLabel}>`
   (FR-054; SC-017).
8. **N8 — Separación de la sesión.** `PrimaryNav` **no** contiene la identidad del
   usuario ni «Cerrar sesión»; esos elementos viven en `SessionBar`, en el
   header, con tratamiento visual distinto (FR-015; SC-009).

## 4. Estructura del AppShell (zonas / landmarks)

| Zona | Elemento / landmark | Contenido | Persistencia |
|------|---------------------|-----------|--------------|
| Identidad de producto | `<header>` (`banner`) — parte izquierda | `Brand`: símbolo + «IDAF» | montada en todas las rutas protegidas |
| Contexto de sesión | dentro del `<header>`, contenedor `aria-label="Sesión"` | icono usuario + `displayName` (truncado si es largo) + `<button>` «Cerrar sesión» | ídem |
| Navegación global | `<nav aria-label="Áreas de IDAF">` (lateral) | 7 entradas icono + nombre (§3) | ídem |
| Contenido del módulo | `<main>` (`main`) | `ModuleHeader` + `<Outlet/>` | cambia por ruta; es la **mayor superficie** (FR-034; SC-018) |

- Las cuatro zonas se distinguen visual y estructuralmente y **mantienen su
  posición y tratamiento** al cambiar de módulo (FR-031, FR-036; SC-017, SC-019).
- A 1024 px de ancho (mínimo soportado — research D14) las cuatro zonas siguen
  visibles y utilizables; la nav puede estrecharse pero no desaparece (FR-046;
  SC-021).

## 5. Invariantes verificables (resumen para tests)

| Invariante | Dónde se prueba |
|------------|-----------------|
| Sin sesión, ninguna de las 7 áreas se monta ni aparece en el DOM | `require-session.test.tsx`; `auth-login.spec.ts` |
| `/login` con sesión → `/`, sin cerrar sesión ni mostrar 2.º formulario | `auth-login.spec.ts` (SC-028) |
| Ruta desconocida con sesión → `/` sin error | `unknown-route.spec.ts` (SC-023) |
| Ruta desconocida sin sesión → `/login` | `unknown-route.spec.ts` |
| Verificación no disponible → `/login`, mensaje distinto, sin sesión | `auth-login.spec.ts` (SC-027) |
| `logout` en una pestaña → otra pestaña a `/login` al reactivarse/recargar | `multi-tab-logout.spec.ts` (SC-029) |
| 7 entradas, icono + nombre, familia única, 1 activa; combinación (label, icon) única, sin duplicados (SC-038) | `primary-nav.test.tsx`; `registry.test.ts`; `nav-icons-active.spec.ts` |
| Activo con ≥ 2 propiedades renderizadas, ≥ 1 no cromática, perceptible en acromatopsia; exactamente 1 activo por vista (SC-031) | `primary-nav.test.tsx`; `nav-icons-active.spec.ts`; `structure-consistency.spec.ts` |
| 4 zonas como landmarks, estables entre módulos | `structure-consistency.spec.ts` (SC-017) |
| `main` = mayor superficie | `structure-consistency.spec.ts` (SC-018) |
| Recarga con sesión conserva sección; sin sesión → login | `session-persistence.spec.ts` (SC-005) |
| Inicio: identidad + propósito + vista general de 7 áreas con estado; sin datos | `home-view.test.tsx`; `home-overview.spec.ts` (SC-030) |
