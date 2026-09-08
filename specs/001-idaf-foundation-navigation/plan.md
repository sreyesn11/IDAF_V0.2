# Implementation Plan: Fundación funcional de IDAF (experiencia base y navegación)

**Branch**: `001-idaf-foundation-navigation` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-idaf-foundation-navigation/spec.md`

## Summary

Esta spec construye la **cáscara navegable de IDAF**: una aplicación de página única
(SPA) que arranca en una pantalla de **Inicio** funcional, expone las **siete áreas
funcionales** en una navegación principal siempre visible, y muestra una vista propia
de "funcionalidad no disponible" para los seis módulos aún no implementados. No hay
backend, autenticación, persistencia ni datos de dispositivos.

**Enfoque técnico** (opción más simple que satisface los requisitos y permite evolución):
SPA en **TypeScript + React + React Router**, empaquetada con **Vite**. El eje del
diseño es un **registro de módulos** (`module registry`): una única lista declarativa
de las siete áreas (identificador, etiqueta visible, orden, estado, componente de
vista) de la que se derivan —sin duplicación— la navegación principal, la lista de
áreas de Inicio y las rutas del router. Incorporar un módulo futuro (Inventario,
Descubrimiento, Conexiones, Diagnósticos, Topología, Observabilidad) consistirá en
cambiar una entrada del registro y su componente de vista, sin tocar la navegación ni
la estructura base. Las rutas desconocidas redirigen a Inicio con la ruta comodín del
router; los fallos de render se resuelven con los límites de error del router.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 20 LTS (solo herramienta de build; el artefacto entregado es estático)

**Primary Dependencies**: React 18, React Router 6 (`react-router-dom`), Vite 5. Sin librerías de estado global, sin UI kit, sin cliente HTTP.

**Storage**: N/A — la spec (Assumptions) establece explícitamente que no hay persistencia de estado ni preferencias; cada apertura parte de Inicio.

**Testing**: Vitest + React Testing Library + jsdom para pruebas unitarias/de componente; Playwright para pruebas end-to-end de navegación, recarga y alternancia rápida.

**Target Platform**: Navegadores de escritorio evergreen (Chromium, Firefox, WebKit). El soporte móvil está fuera de foco por la spec.

**Project Type**: Aplicación web de página única, solo frontend. Proyecto único en la raíz del repositorio.

**Performance Goals**: La navegación entre áreas no debe provocar una recarga completa de la aplicación y debe permanecer utilizable. (Sin objetivos numéricos: la spec no fija métricas de rendimiento.)

**Constraints**: Sin backend ni red en tiempo de ejecución; bundle estático servible desde disco/CDN; sin autenticación (FR-023); sin datos que aparenten dispositivos (FR-019); terminología de las siete áreas idéntica entre Inicio y navegación (FR-025), garantizada por fuente única; una recarga o acceso directo a una ruta válida conserva el área (FR-027), lo que exige *fallback* SPA a `index.html` (o `HashRouter`); navegación principal operable por teclado, con foco visible y área activa perceptible (FR-028–FR-031).

**Scale/Scope**: 7 áreas fijas; 1 pantalla funcional (Inicio) + 6 vistas de placeholder + 1 vista de error de sección. Los destinos desconocidos redirigen a Inicio (sin vista propia). Un solo perfil de usuario, sin roles.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

La Constitución de IDAF v1.0.0 tiene 12 principios. La mayoría regula descubrimiento,
inventario, conexión, diagnóstico, credenciales, topología real y telemetría, todo
ello **explícitamente fuera del alcance** de esta spec (spec §Out of Scope, FR-026).
Esos principios no se violan porque las capacidades que gobiernan no se implementan ni
se simulan. Evaluación de las puertas aplicables:

| Principio | Aplicabilidad a SPEC 001 | Cumplimiento del plan |
|-----------|--------------------------|-----------------------|
| I. Descubrimiento seguro y no destructivo | No aplica: no hay interacción con dispositivos. | ✅ Trivial: cero operaciones sobre dispositivos. |
| II. Separación descubrimiento/gestión | No aplica: no hay inventario. | ✅ Trivial. |
| III. Identidad única y consistente | No aplica: no hay dispositivos. | ✅ Trivial. |
| IV. Diagnóstico trazable | No aplica: no hay diagnósticos. | ✅ Trivial. |
| **V. Arquitectura modular y extensible** | **Aplica directamente.** | ✅ Registro de módulos + carpeta por módulo (`src/modules/<area>/`) desacopladas; navegación y rutas derivadas del registro; añadir un módulo futuro = una entrada + su componente, sin rediseñar el núcleo. Ver `contracts/module-registry.md`. |
| VI. Independencia tecnológica y de fabricante | Aplica de forma preventiva. | ✅ El núcleo (layout, navegación, registro, router) no conoce ninguna área concreta salvo por datos del registro; ninguna dependencia de fabricante. |
| VII. Diagnóstico antes que modificación | No aplica. | ✅ Trivial. |
| **VIII. Seguridad de acceso** | Aplica de forma preventiva. | ✅ Sin credenciales ni secretos en esta spec; repositorio sin secretos; sin variables de entorno sensibles. |
| IX. Observabilidad como capacidad fundamental | No aplica como módulo; sí como higiene. | ✅ Errores visibles al usuario son comprensibles (FR-020/021); los detalles técnicos van a `console.error`, no a la UI. No se construye telemetría (fuera de alcance). |
| X. Evolución hacia diagnóstico inteligente | No aplica: sin IA. | ✅ Trivial. |
| XI. Fuente de verdad consistente | Aplica en pequeño: terminología. | ✅ Fuente única de textos y etiquetas (`src/content/`), consumida por Inicio y por la navegación → FR-025 garantizado estructuralmente. |
| **XII. Integridad del sistema** | Aplica como criterio de diseño. | ✅ Proyecto greenfield: no hay comportamiento previo que romper. El registro y los puntos de extensión se diseñan para que specs futuras añadan sin modificar el núcleo de navegación. |

**Restricciones Adicionales**: "Operaciones de escritura", "Gestión de secretos",
"Neutralidad del núcleo", "Persistencia con historial" y "Correlación de identidad" no
aplican a esta spec (no hay dispositivos, secretos ni persistencia). La restricción de
neutralidad del núcleo se respeta: el núcleo no importa nada específico de un área.

**Flujo de Desarrollo y Puertas de Calidad**: el PR de esta feature verificará los 12
principios (esta tabla); no toca descubrimiento/inventario/conexión/diagnóstico/
trazabilidad, por lo que no requiere cobertura de regresión de esas áreas; no
introduce secretos.

**Resultado de la puerta (pre-Fase 0)**: ✅ PASA. Sin violaciones. `Complexity
Tracking` queda vacío.

**Re-evaluación post-Fase 1**: ✅ PASA sin cambios. El diseño producido
(`data-model.md`, `contracts/module-registry.md`, `contracts/navigation-and-routes.md`,
`quickstart.md`) refuerza el Principio V (registro único como punto de extensión
verificable), el Principio XI (fuente única de terminología) y el Principio XII (el
procedimiento documentado para añadir un módulo futuro no toca el núcleo de
navegación). No se introdujo ninguna dependencia de fabricante, secreto, ni
persistencia. No hay nueva complejidad que justificar.

**Re-evaluación post-análisis (correcciones H1/M1–M5 + LOW, 2026-09-05)**: ✅ PASA sin
cambios. El cierre explícito del comportamiento de recarga (FR-027, ruta en la URL, no
estado persistido) y los mínimos de accesibilidad de la navegación (FR-028–FR-031,
resueltos con `NavLink` + `aria-current` + `:focus-visible`, sin gestión de foco
programática ni auditoría WCAG — ver `research.md` D13) no añaden dependencia de
fabricante, secreto ni persistencia, y no tocan el núcleo de navegación derivado del
registro. Sin nueva complejidad que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/001-idaf-foundation-navigation/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Fase 0 — decisiones técnicas y su relación con la spec
├── data-model.md        # Fase 1 — entidades: Área funcional, Estado de disponibilidad
├── quickstart.md        # Fase 1 — guía de ejecución y validación de criterios de aceptación
├── contracts/           # Fase 1 — contratos internos de extensibilidad
│   ├── module-registry.md       # Contrato que toda área (presente y futura) debe cumplir
│   └── navigation-and-routes.md # Contrato de rutas, navegación y estados de error
└── tasks.md             # Fase 2 (/speckit-tasks — NO lo crea /speckit-plan)
```

### Source Code (repository root)

```text
idaf_project/
├── index.html                     # Punto de entrada del bundle Vite
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Config Vite + Vitest (jsdom)
├── playwright.config.ts
├── src/
│   ├── main.tsx                   # Monta <App/> en #root
│   ├── App.tsx                    # Provee el router; nada específico de un área
│   ├── app/
│   │   ├── router.tsx             # Construye las rutas del registro; ruta comodín `*` redirige a Inicio (FR-022)
│   │   ├── AppLayout.tsx          # Marco persistente: navegación principal + área de contenido (<Outlet/>)
│   │   └── RouteError.tsx         # Vista amigable de "no se pudo mostrar la sección" (FR-021)
│   ├── modules/
│   │   ├── types.ts              # FunctionalArea, AvailabilityStatus
│   │   ├── registry.ts          # LISTA ÚNICA de las 7 áreas (orden, etiqueta, estado 'available'|'unavailable', componente)
│   │   ├── home/
│   │   │   └── HomeView.tsx      # Único módulo funcional: identidad + propósito + lista de 7 áreas con estado
│   │   ├── inventory/
│   │   │   └── InventoryView.tsx # Usa <ModuleUnavailable/>
│   │   ├── discovery/DiscoveryView.tsx
│   │   ├── connections/ConnectionsView.tsx
│   │   ├── diagnostics/DiagnosticsView.tsx
│   │   ├── topology/TopologyView.tsx
│   │   └── observability/ObservabilityView.tsx
│   ├── components/
│   │   ├── PrimaryNav.tsx        # Renderiza las 7 entradas desde el registro; marca la activa
│   │   └── ModuleUnavailable.tsx # Placeholder honesto: nombre del área + mensaje "pendiente", sin acciones
│   └── content/
│       └── idaf.ts               # Fuente única: nombre de producto, texto de propósito, etiquetas de áreas, textos de mensajes
├── tests/
│   ├── unit/
│   │   ├── registry.test.ts             # Invariantes: exactamente 7, orden, etiquetas únicas, solo Inicio disponible
│   │   ├── home-view.test.tsx           # FR-001..FR-005, SC-001
│   │   ├── primary-nav.test.tsx         # FR-006..FR-009, FR-025, FR-028..FR-030, SC-001
│   │   ├── module-unavailable.test.tsx  # FR-015..FR-018, SC-004
│   │   └── route-error.test.tsx         # FR-020, FR-021 (incl. reintento que vuelve a fallar)
│   └── e2e/
│       ├── navigation.spec.ts           # FR-010/011/012, FR-023 (sin login), FR-029, SC-002/003, US2 escenarios 1-3
│       ├── repeat-and-rapid.spec.ts     # FR-013/014, EC-01/EC-02, SC-006/007
│       ├── reload.spec.ts               # FR-027 / EC-06: recarga y acceso directo conservan el área
│       ├── a11y-nav.spec.ts             # FR-028..FR-031: teclado, foco visible, área activa (aria-current)
│       ├── no-device-data.spec.ts       # FR-017/019/026: ninguna de las 7 áreas muestra datos de dispositivo
│       └── unknown-route.spec.ts        # FR-022 / EC-05: destino desconocido redirige a Inicio
└── public/                              # Activos estáticos (favicon, etc.)
```

**Structure Decision**: Proyecto único, solo frontend, en la raíz del repositorio.
Un único árbol `src/` con separación en tres capas:

1. **`src/app/`** — el *núcleo* de la cáscara: layout persistente, router y vistas de
   error. No conoce ninguna área concreta; solo consume el registro.
2. **`src/modules/<area>/`** — una carpeta **autocontenida por área**. Hoy seis de
   ellas exportan solo una vista de placeholder; una spec futura reemplazará el
   contenido de su carpeta sin tocar `src/app/` ni `PrimaryNav`. Este límite es lo que
   satisface el requisito de "separación suficiente" y el Principio V.
3. **`src/components/`** y **`src/content/`** — piezas de presentación compartidas y la
   fuente única de terminología (FR-025 / Principio XI).

No se usa la estructura "web app (backend + frontend)" porque no hay backend en esta
spec ni lo habrá para cumplirla; añadirlo sería arquitectura anticipada.

## Complexity Tracking

> Sin violaciones de la Constitución. Tabla no aplicable.
