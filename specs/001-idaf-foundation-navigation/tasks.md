---
description: "Task list for feature implementation"
---

# Tasks: Fundación funcional de IDAF (experiencia base y navegación)

**Input**: Design documents from `/specs/001-idaf-foundation-navigation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/module-registry.md, contracts/navigation-and-routes.md, quickstart.md

**Tests**: INCLUDED. The spec defines acceptance scenarios, success criteria and edge cases that must be answerable Yes/No; research D12 mandates a Vitest + Playwright suite. Test tasks are therefore first-class here.

**Organization**: Tasks are grouped by user story. US1 and US2 are both Priority P1 (US1 is the MVP surface, US2 makes it navigable); US3 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]` / `[US2]` / `[US3]` for story-phase tasks; Setup, Foundational, Routes/Errors and Polish tasks carry no story label
- Every task names the exact file(s) it produces or changes and the observable result that must exist when it is done

## Path Conventions

Single frontend project at the repository root (`idaf_project/`), per plan.md → *Structure Decision*. Source in `src/`, tests in `tests/`.

## Scope guardrails (apply to every task)

- Exactly **seven** areas, in this order: Inicio, Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología, Observabilidad.
- Only **Inicio** is `available`; the other six are `unavailable`. The only visible status label is **"No disponible"** ("Próximamente" is not used).
- One **single source of truth** for area names/status: `src/content/idaf.ts` feeding `src/modules/registry.ts`; navigation, Home list and routes are all derived from that registry — no parallel list.
- Direct navigation between any two areas; unknown routes redirect to Inicio (FR-022 / EC-05); a browser reload or direct URL to a valid area route keeps that area (FR-027 / EC-06); only `/` opens on Inicio; no simulated device data anywhere.
- Accessibility is limited to the **minimums of FR-028…FR-031** (primary nav keyboard-operable, visible focus, accessible names, perceivable active area). No WCAG audit, no advanced ARIA, no programmatic focus management, no skip links.
- **Do not** add: device inventory, network discovery, device connections, SSH, credentials, command execution, diagnostics, real topology, operational observability, telemetry, OpenWrt, OpenThread, AI, backend, or any persistence. No authentication. No anticipatory architecture (no code-splitting, no state library, no HTTP client).

---

## Phase 1: Setup (project preparation)

**Purpose**: Create the buildable, testable frontend shell with no feature behaviour yet.

- [X] T001 Create `package.json` at repo root declaring dependencies `react@^18`, `react-dom@^18`, `react-router-dom@^6`, and devDependencies `typescript@^5`, `vite@^5`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`; scripts `dev`, `build`, `preview`, `test` (vitest run), `test:e2e` (playwright test). **Done when**: `npm install` completes and `npm ls react react-router-dom vite typescript` resolves without errors.
- [X] T002 [P] Create `tsconfig.json` and `tsconfig.node.json` (strict mode, `"jsx": "react-jsx"`, bundler module resolution, `src` + `tests` included). **Done when**: `npx tsc --noEmit` exits 0 against an empty `src/`.
- [X] T003 [P] Create `vite.config.ts` (React plugin; Vitest block: `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./tests/setup.ts']`, `include: ['tests/unit/**/*.test.{ts,tsx}']`), `tests/setup.ts` importing `@testing-library/jest-dom`, and a minimal smoke test `tests/unit/setup.smoke.test.tsx` that renders a trivial element with React Testing Library and asserts a `jest-dom` matcher works (e.g. `expect(screen.getByText('ok')).toBeInTheDocument()`), proving jsdom + RTL + jest-dom are wired. **Done when**: `npm run test` executes and reports exactly 1 passing test (`setup.smoke`), not an empty run.
- [X] T004 [P] Create `playwright.config.ts` (`testDir: 'tests/e2e'`, `webServer` running `npm run preview` on a fixed port with `reuseExistingServer`, `projects` for chromium + firefox + webkit, `baseURL` set). **Done when**: `npx playwright test --list` runs without a configuration error.
- [X] T005 [P] Create `index.html` (with `<div id="root">`), `src/main.tsx` (`ReactDOM.createRoot(...).render(<App/>)`) and a temporary `src/App.tsx` returning a static `IDAF` placeholder. **Done when**: `npm run dev` serves a page at `http://localhost:5173` that renders the placeholder with no console errors.

**Checkpoint**: `npm run dev`, `npm run build`, `npm run test` (1 smoke test passing), `npm run test:e2e` (0 e2e tests) all execute. No feature code yet.

---

## Phase 2: Foundational (shared core — blocks all user stories)

**Purpose**: The contract types, the single text source, and the honest "unavailable" building blocks that the module registry (Phase 3) imports. **No user story can start until this phase is done** because the registry references every area's view component.

- [X] T006 [P] Create `src/modules/types.ts` defining `AvailabilityStatus = 'available' | 'unavailable'` and `interface FunctionalArea { id; path; label; order; status; Component }` exactly as `contracts/module-registry.md` → *Forma del contrato* (`id` union of the seven slugs, `Component: React.ComponentType`). **Done when**: the file type-checks and both symbols are importable. *(Traces: FR-006; contract R1–R6)*
- [X] T007 [P] Create `src/content/idaf.ts` as the **single source of truth** for all visible text: product name `"IDAF"`; a `purpose` string mentioning descubrimiento, gestión, diagnóstico y observabilidad de dispositivos de **red e IoT**; `areaLabels` keyed by the seven ids (`"Inicio"`, `"Inventario"`, `"Descubrimiento"`, `"Conexiones"`, `"Diagnósticos"`, `"Topología"`, `"Observabilidad"`); `statusText.available = "Disponible"` and `statusText.unavailable = "No disponible"`; `unavailableBody` stating the functionality *todavía no está disponible* and *se incorporará en una versión posterior de IDAF*; `sectionErrorText` (friendly "no se pudo mostrar esta sección"). **Done when**: the file type-checks and every other module can obtain these strings only from here (no area text literals elsewhere). *(Traces: FR-002, FR-003, FR-005, FR-025; research D10; Constitution XI)*
- [X] T008 Create `src/components/ModuleUnavailable.tsx` — props `{ areaLabel: string }`; renders a `<section>` with a heading containing `areaLabel` and a paragraph rendering `idaf.unavailableBody`; contains **no** `<button>`, `<input>`, `<form>`, actionable `<a>`, nor any element with `role="button"`; content is non-empty and shows no technical/internal text. **Done when**: rendering `<ModuleUnavailable areaLabel="Topología" />` shows the label heading + pending message and a DOM query for `button`/`input` finds nothing. *(Traces: FR-016, FR-017, FR-018; US3; contract "Contrato de la vista de módulo no disponible")*
- [X] T009 Create the six unavailable-module view files, each returning `<ModuleUnavailable areaLabel={idaf.areaLabels.<id>} />`: `src/modules/inventory/InventoryView.tsx`, `src/modules/discovery/DiscoveryView.tsx`, `src/modules/connections/ConnectionsView.tsx`, `src/modules/diagnostics/DiagnosticsView.tsx`, `src/modules/topology/TopologyView.tsx`, `src/modules/observability/ObservabilityView.tsx`. **Done when**: all six files type-check and each renders its own labelled unavailable view; none adds any control or data. *(Traces: FR-015; contract route table)*

**Checkpoint**: types + text source + the honest placeholder exist. The registry can now be assembled.

---

## Phase 3: User Story 1 — Reconocer qué es IDAF al ingresar (Priority: P1) 🎯 MVP

**Goal**: On opening the app, the user lands on a Home screen that names IDAF, explains its purpose, and lists the seven areas with their availability status; the registry-derived navigation shell that renders it is in place.

**Independent Test**: Run `npm run dev`, open `/`. The screen shows "IDAF", a purpose sentence covering descubrimiento/gestión/diagnóstico/observabilidad de dispositivos de red e IoT, and the seven areas each once with status ("Disponible" for Inicio, "No disponible" for the other six). `npm run test` for `registry`, `home-view`, `primary-nav` is green.

### Implementation for User Story 1

> **Acyclic implementation order** (no import cycle): content/types → views → registry → navigation → router → the router hands the registry-derived area data to `HomeView`. `HomeView` never imports `registry.ts`; `registry.ts` imports only leaf view components. `MODULE_REGISTRY` stays the one and only list of areas.

- [X] T010 [P] [US1] Create `src/modules/home/HomeView.tsx` as a **presentational, props-driven** component: signature `HomeView({ areas = [] }: { areas?: { label: string; statusText: string }[] })` — `areas` optional (default `[]`) so the component is assignable to `React.ComponentType` for the registry entry, while the router always passes the real list. It renders the visible product name `idaf.productName`, a purpose block from `idaf.purpose`, and an ordered list of the `areas` rows (`{label}` + `{statusText}`); renders **no** table/rows/values that could look like real or simulated devices. It imports only `src/content/idaf.ts` — **never** `src/modules/registry.ts`. **Done when**: `render(<HomeView areas={[{label:'Inicio',statusText:'Disponible'}, …]} />)` shows IDAF, the purpose text, and one row per supplied area in order, with no registry import in the file. *(Traces: FR-001, FR-002, FR-003, FR-004, FR-005, FR-019; SC-005; CA-01, CA-02, CA-03)*
- [X] T011 [US1] Create `src/modules/registry.ts` — the single source of truth (pure TypeScript, no JSX). Export `MODULE_REGISTRY: readonly FunctionalArea[]` with **exactly seven** entries in FR-006 order: `home` → path `/`, label `idaf.areaLabels.home`, `order: 1`, `status: 'available'`, `Component: HomeView`; then `inventory` `/inventario` (2), `discovery` `/descubrimiento` (3), `connections` `/conexiones` (4), `diagnostics` `/diagnosticos` (5), `topology` `/topologia` (6), `observability` `/observabilidad` (7), each `status: 'unavailable'` with its Phase 2 view component as `Component`. Also export a pure selector `selectAreaList(registry = MODULE_REGISTRY)` mapping the registry (sorted by `order`) to `{ label, statusText }[]` (`statusText` from `idaf.statusText`). `registry.ts` imports `HomeView`, the six module views and `idaf.ts` — all leaves; nothing it imports imports it back. All labels come from `idaf.areaLabels`. **Done when**: the array has 7 entries, `selectAreaList()` returns 7 `{label,statusText}` rows in order, the app type-checks, and `MODULE_REGISTRY` is the only list of areas in the codebase. *(Traces: FR-004, FR-005, FR-006, FR-007, FR-025; contract R1–R7; SC-001)*
- [X] T012 [P] [US1] Create `src/components/PrimaryNav.tsx` — a `<nav aria-label="Áreas de IDAF">` that maps `MODULE_REGISTRY` sorted by `order` to one `<NavLink to={path}>{label}</NavLink>` per area (each area exactly once), using `NavLink`'s active state to mark the current area. Labels are read from the registry entries only; each link's accessible name is its visible label. The active `NavLink` sets `aria-current="page"` in addition to the visual active style, and the links have an explicit `:focus-visible` outline. **Done when**: the component renders 7 keyboard-focusable links in FR-006 order; the link matching the current route carries the active state and `aria-current="page"`; a visible focus indicator is present on `:focus-visible`. *(Traces: FR-006, FR-007, FR-008, FR-009, FR-012, FR-025, FR-028, FR-029, FR-030, FR-031; SC-001; CA-04)*
- [X] T013 [US1] Create `src/app/AppLayout.tsx` — a layout element that always renders `<PrimaryNav/>` plus `<main><Outlet/></main>`, so the primary navigation stays mounted across every route change. **Done when**: navigating between two routes keeps a single `PrimaryNav` instance mounted and visible. *(Traces: FR-008; contract C1)*
- [X] T014 [US1] Create `src/app/router.tsx` — this is the layer that mounts the views and feeds Home its data. `createBrowserRouter` with one `AppLayout` route whose children are generated by iterating `MODULE_REGISTRY`: the `home` entry (`path === '/'`) → `{ index: true, element: <HomeView areas={selectAreaList()} /> }` (router imports `HomeView` and `selectAreaList` from `registry.ts` and composes them here); every non-home entry → `{ path: entry.path, element: <entry.Component /> }`; plus a trailing `{ path: '*', element: <Navigate to="/" replace /> }`. No hand-written route list parallel to the registry. **Done when**: the router resolves all seven registry paths to the right view — with Home receiving its `areas` derived from `MODULE_REGISTRY` — and any other path renders a redirect to `/`. Uses `createBrowserRouter` (clean URLs) so a reload / direct URL on a valid path resolves to its view (FR-027), given the SPA deep-link fallback. *(Traces: FR-009, FR-010, FR-011, FR-012, FR-015, FR-022, FR-027; contract route table, C6, C7)*
- [X] T015 [US1] Replace `src/App.tsx` with `<RouterProvider router={router} />` and confirm `src/main.tsx` mounts `<App/>` into `#root`. The app opens directly on Home with no login/auth gate. **Done when**: `npm run dev` shows Home at `/` (with the 7 status rows), a manual visit to `/topologia` shows the Topología unavailable view, `PrimaryNav` is visible on every route, and `/` renders with no login/authentication form or gate (no password field, no "Iniciar sesión"/"Login" control). *(Traces: FR-001, FR-023; US1; US2)*

### Tests for User Story 1

- [X] T016 [P] [US1] Create `tests/unit/registry.test.ts` asserting the registry invariants: exactly 7 entries; `order` values are `1..7` with no gaps/repeats in the FR-006 sequence; `id`, `path`, `label` each unique; exactly one entry has `status: 'available'` and it is `home`; `selectAreaList()` returns 7 `{label,statusText}` rows in `order`, with `statusText` `"Disponible"` only for Inicio and `"No disponible"` for the other six; rendering each `unavailable` entry's `Component` produces a `ModuleUnavailable` output (label heading present, no `button`/`input`). **Done when**: `npm run test registry` passes. *(Traces: FR-005, FR-006, FR-007, FR-016–FR-018, FR-025; SC-001, SC-004; contract R1–R7)*
- [X] T017 [P] [US1] Create `tests/unit/home-view.test.tsx` — render `<HomeView areas={selectAreaList()} />` directly (selector imported from `registry.ts`, so the list stays single-sourced; `HomeView` takes no router dependency) and assert: the text "IDAF" is present; the purpose text contains "descubrimiento", "gestión", "diagnóstico", "observabilidad" and "red e IoT"; the seven area labels each appear once with a status label — "Disponible" exactly once (Inicio) and "No disponible" six times; no element resembling a device record is rendered. **Done when**: `npm run test home-view` passes. *(Traces: FR-001–FR-005, FR-019; SC-001, SC-005; CA-01–CA-03)*
- [X] T018 [P] [US1] Create `tests/unit/primary-nav.test.tsx` asserting: exactly 7 navigation links; their visible labels equal the `idaf.areaLabels` values and appear in FR-006 order; each label string is identical to the corresponding `selectAreaList()` row label (both resolve from `idaf.areaLabels` via the registry — one source); rendering with a given current route marks exactly one link active and that link exposes `aria-current="page"`; each link's accessible name equals its visible label; `userEvent.tab()` reaches each of the 7 links in FR-006 order. **Done when**: `npm run test primary-nav` passes. *(Traces: FR-006, FR-007, FR-009, FR-025, FR-028, FR-029, FR-030; SC-001; CA-04)*

**Checkpoint**: MVP is usable — the app boots to a truthful Home screen inside a persistent, registry-derived navigation shell.

---

## Phase 4: User Story 2 — Navegar entre todas las áreas (Priority: P1)

**Goal**: From any area the user reaches any other of the seven in one step without passing through Inicio and without a document reload; returning to Inicio is one step; repeated and rapid selection stay stable.

**Independent Test**: With `npm run preview` running, `npm run test:e2e` for `navigation`, `repeat-and-rapid`, `reload` and `a11y-nav` is green; manually, from `/topologia` clicking "Inventario" lands on `/inventario` with no page reload, and clicking "Inicio" from any area returns to `/`.

- [X] T019 [P] [US2] Create `tests/e2e/navigation.spec.ts` — from `/`, click each of the 7 nav entries and assert the URL and the view heading match; from `/topologia` click "Inventario" and assert URL `/inventario` + heading "Inventario" with **no full-document reload** (e.g. set a `window` flag on first load and assert it survives); from several areas click "Inicio" and assert `/` + Home in a single step; assert the active nav entry for the current route carries `aria-current="page"`; on first load of `/` assert no login/authentication form or gate is present. **Done when**: `npm run test:e2e navigation` passes on chromium, firefox and webkit. *(Traces: FR-008, FR-009, FR-010, FR-011, FR-012, FR-023, FR-029; SC-002, SC-003; US2 scenarios 1–3; contract C1–C3; CA-04, CA-05, CA-06)*
- [X] T020 [P] [US2] Create `tests/e2e/repeat-and-rapid.spec.ts` — (a) on `/diagnosticos`, click the "Diagnósticos" nav link 10 times and assert: no console error, exactly one module heading in the DOM, no duplicated content; (b) rapidly click across areas 20+ times and assert: after settling only the last area's heading is present, the app still responds to one further navigation, and the browser console logged no errors. **Done when**: `npm run test:e2e repeat-and-rapid` passes. *(Traces: FR-013, FR-014; SC-006, SC-007; EC-01 "selección repetida del módulo actual", EC-02 "navegación rápida entre módulos"; contract C4, C5, C9; CA-10, CA-11)*
- [X] T021 [P] [US2] Create `tests/e2e/reload.spec.ts` — navigate to `/topologia`, reload the browser, and assert the **only** accepted outcome per FR-027: the URL is still `/topologia` and the Topología view is shown, with `PrimaryNav` visible and usable (a subsequent click on "Inicio" navigates to `/`). Also assert a direct `goto('/diagnosticos')` (fresh load, no in-app navigation) shows the Diagnósticos view. This depends on the SPA deep-link fallback served by `npm run preview` (T004 webServer). Unknown routes are out of scope here — their redirect to Inicio is covered by T028. **Done when**: `npm run test:e2e reload` passes with the strict `/topologia` → reload → `/topologia` assertion and the direct-URL assertion. *(Traces: FR-027; US2 scenario 5; EC-06 "recarga estando en un módulo"; contract C7)*
- [X] T035 [P] [US2] Create `tests/e2e/a11y-nav.spec.ts` — with `npm run preview` running: from document start, `Tab` reaches each of the 7 primary-nav entries in FR-006 order; pressing `Enter` on a focused entry navigates to that area; the focused entry shows a visible focus indicator (assert a non-`none` outline / `:focus-visible` style, or that `document.activeElement` is the nav link with a visible ring); the entry for the current route exposes `aria-current="page"`; each entry's accessible name equals its visible label. **Done when**: `npm run test:e2e a11y-nav` passes on chromium, firefox and webkit. *(Traces: FR-028, FR-029, FR-030, FR-031; contract C10; CA-04)*

**Checkpoint**: navigation between all seven areas is proven stable under repetition, speed, reload and keyboard-only operation.

---

## Phase 5: User Story 3 — Entender que un módulo aún no está disponible (Priority: P2)

**Goal**: Each of the six pending modules shows its own view, titled with the module name, stating explicitly that the functionality is not yet available and will be added later — with zero actions that appear operational and no device-like data.

**Independent Test**: `npm run test` for `module-unavailable` is green and `npm run test:e2e no-device-data` is green; manually, entering each of the six pending areas shows its name + the pending message and no operational buttons.

- [X] T022 [US3] Finalize the copy in `src/components/ModuleUnavailable.tsx` so the body text explicitly says the functionality *todavía no está disponible* **and** *se incorporará en una versión posterior de IDAF*, sourced from `idaf.unavailableBody`; re-verify there is no actionable control, no empty state, no error styling and no technical/internal text. **Done when**: the rendered output matches every bullet of `contracts/navigation-and-routes.md` → *Contrato de la vista de módulo no disponible*. *(Traces: FR-016, FR-017, FR-018; US3 scenarios 1–3; CA-07, CA-08)*
- [X] T023 [P] [US3] Create `tests/unit/module-unavailable.test.tsx` — for each of the six area labels, render its module view and assert: a heading contains the label; the body contains the pending-feature phrasing; `queryAllByRole('button')` is empty, there is no `<input>`, no `<a>` with operational text, no `role="button"`; no raw error text is shown; the view is not empty. **Done when**: `npm run test module-unavailable` passes. *(Traces: FR-015, FR-016, FR-017, FR-018; SC-004; US3; CA-07, CA-08, CA-09)*
- [X] T024 [P] [US3] Create `tests/e2e/no-device-data.spec.ts` — visit all seven routes and assert none renders device-like content (no rows/tables with IP / MAC / hostname-style values, no device state or metric values) and none exposes operational action controls such as "Escanear red", "Ejecutar diagnóstico", "Analizar dispositivo" or "Iniciar descubrimiento". Descriptive prose about what each area will do is allowed. **Done when**: `npm run test:e2e no-device-data` passes. *(Traces: FR-017, FR-019, FR-026; SC-004; US3 scenario 2; CA-09)*

**Checkpoint**: all six pending modules are honest, self-identified and inert.

---

## Phase 6: Rutas y manejo de errores (cross-cutting)

**Purpose**: Unknown destinations and section render failures resolve to comprehensible, recoverable states — never a raw error or stack.

- [X] T025 Create `src/app/RouteError.tsx` — the element used as the router `errorElement`: renders `idaf.sectionErrorText`, a "Reintentar" action that re-attempts the current route (revalidate / re-navigate) and a "Volver a Inicio" link to `/` that is always present; if the route fails again after "Reintentar", `RouteError` stays shown with the message and the "Volver a Inicio" link. Sends the caught error to `console.error`; never renders `error.message` or a stack to the DOM. **Done when**: rendering it in isolation shows the friendly copy plus both recovery actions and no technical text. *(Traces: FR-020, FR-021; EC-04 "fallo al mostrar una sección", EC-03 "módulo sin funcionalidad"; research D9; contract C8)*
- [X] T026 Wire error handling in `src/app/router.tsx` (add `errorElement: <RouteError/>` to the layout route and to each child route) and add `src/app/RootErrorBoundary.tsx` wrapping `<RouterProvider>` in `src/App.tsx` for errors thrown outside the route tree (same friendly fallback + "Volver a Inicio"). **Done when**: a view forced to throw renders `RouteError` (not a stack) and the user can get back to Home; normal navigation shows no technical error text. *(Traces: FR-020, FR-021; research D9)*
- [X] T027 [P] Create `tests/unit/route-error.test.tsx` — mount a route whose element throws on render; assert the friendly message is visible, "Reintentar" and "Volver a Inicio" are present, the thrown error's message string is **not** in the document, and `console.error` was called; then activate "Reintentar" on a route that still throws and assert the friendly message and "Volver a Inicio" remain (no stack, no crash). **Done when**: `npm run test route-error` passes. *(Traces: FR-020, FR-021; EC-04 "fallo al mostrar una sección"; contract C8)*
- [X] T028 [P] Create `tests/e2e/unknown-route.spec.ts` — `goto('/ruta-inexistente')` and assert the app lands on `/` with Home + `PrimaryNav` visible, shows no crude error/stack text, and replaced history (the browser Back button does not return to the invalid URL). **Done when**: `npm run test:e2e unknown-route` passes. *(Traces: FR-022; EC-05 "ruta / destino desconocido"; contract C6; CA-12)*

**Checkpoint**: every edge case in the spec has an automated Yes/No check.

---

## Phase 7: Pulido y validación final

**Purpose**: Confirm the static artifact builds and serves correctly and that the acceptance criteria answer "Sí".

**Acceptance gate for SPEC 001**: the automated suite (T031), the strict edge-case e2e checks, and the CA-01 … CA-12 manual walkthrough (T032) are **mandatory** — SPEC 001 is not accepted until they all pass "Sí". T033 (SC-005 user-comprehension check) and T034 (SC-006 long-session observation) are **usability validations, non-blocking**: a poor result is logged as follow-up feedback (wording tweaks in `src/content/idaf.ts`) and does not by itself block acceptance, since SC-005 depends on human judgement and Assumptions allows the exact copy to be adjusted.

- [X] T029 [P] Create `README.md` at repo root with the runnable command list from `quickstart.md` (`npm install`, `npm run dev`, `npm run build`, `npm run preview`, `npm run test`, `npm run test:e2e`) and the SPA deep-link fallback note. **Done when**: `README.md` exists and its commands match `package.json` scripts. *(Traces: quickstart.md)*
- [X] T030 Run `npm run build` then `npm run preview` and manually load `/`, `/topologia` and `/ruta-inexistente`. **Done when**: `dist/` contains `index.html` + assets, `/` shows Home, `/topologia` shows the Topología unavailable view after a hard reload (SPA deep-link fallback working), and `/ruta-inexistente` redirects to Home. *(Traces: FR-011, FR-022, FR-027; contract C6, C7; SC-002, SC-003 deploy sanity)*
- [X] T031 Run the full automated suite: `npm run test` and `npm run test:e2e` across chromium, firefox and webkit. **Done when**: both runs report 0 failures and the logged coverage includes `registry`, `home-view`, `primary-nav`, `module-unavailable`, `route-error`, `navigation`, `repeat-and-rapid`, `reload`, `a11y-nav`, `no-device-data`, `unknown-route`. *(Traces: FR-001–FR-031 (automatable parts); SC-001–SC-004, SC-006 automated part, SC-007)*
- [X] T032 Walk the acceptance criteria **CA-01 … CA-12 as defined in `spec.md` → *Criterios de aceptación (CA-01 … CA-12)*** (the `quickstart.md` checklist maps each CA to a validation scenario) against `npm run dev`, recording Sí/No for each. **Done when**: a completed table with twelve "Sí" is saved (e.g. in the PR description or a `specs/001-idaf-foundation-navigation/acceptance-run.md` note). *(Traces: SC-008; CA-01 … CA-12)*
- [ ] T033 **[NON-BLOCKING for SPEC 001 acceptance]** Run the `quickstart.md` → *SC-005* comprehension check: a person with a network/support profile and no prior IDAF exposure uses the app for under 3 minutes and answers the five questions (qué es IDAF, para qué sirve, cuáles serán sus capacidades, cuáles están disponibles hoy, dónde encontrar cada una). **Done when**: the result is recorded (all five correct = pass); a miss is filed as copy-tuning feedback against `src/content/idaf.ts`, not a build blocker. Automated functional checks and CA-01 … CA-12 (T031, T032) remain mandatory regardless of this outcome. *(Traces: FR-024; SC-005 — human-judgement criterion)*
  - **Estado (2026-09-07): PENDIENTE — requiere un participante humano.** No bloquea la aceptación. Ver `acceptance-run.md` → *Validaciones no bloqueantes*.
- [ ] T034 [P] **[NON-BLOCKING for SPEC 001 acceptance — SC-006 is already gated by T020/T031]** Run the `quickstart.md` → *V9* long-session check in a real browser with DevTools open: traverse the seven areas and alternate between them at least 20 times. **Done when**: a recorded note confirms zero visible technical errors, zero blank screens, zero duplicated content and an empty browser console. *(Traces: FR-020; SC-006 observación manual prolongada — no bloqueante; EC-02 "navegación rápida entre módulos"; contract C9)*
  - **Estado (2026-09-07): parte automatizada VERDE** (`tests/e2e/repeat-and-rapid.spec.ts`, 24 alternancias, consola sin errores, chromium/firefox/webkit). La observación manual prolongada con DevTools abiertas queda **pendiente** como complemento no bloqueante.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: needs Phase 1. **Blocks Phases 3–6** (the registry imports the Phase 2 components).
- **User Story 1 (Phase 3)**: needs Phase 2. Delivers the registry + shell + Home = MVP.
- **User Story 2 (Phase 4)**: needs Phase 3 (registry, router, `PrimaryNav`, `AppLayout` must exist to be exercised).
- **User Story 3 (Phase 5)**: needs Phase 2 for `ModuleUnavailable`; needs Phase 3 for the routes that mount the six views. Independent of Phase 4.
- **Routes/Errors (Phase 6)**: needs Phase 3 (`router.tsx`, `App.tsx`). Independent of Phases 4–5.
- **Polish (Phase 7)**: needs Phases 3–6 complete.

### Within phases

- T001 → T002, T003, T004, T005.
- T006 and T007 are independent. T008 needs T007. T009 needs T008.
- **Acyclic Phase 3 chain**: T010 (`HomeView`, presentational) needs only T007 → **T011** (`registry.ts` = `MODULE_REGISTRY` + pure `selectAreaList`) needs T006, T007, T009, T010 → **T012** (`PrimaryNav`) needs T011 → **T013** (`AppLayout`) needs T012 → **T014** (`router.tsx`, composes `<HomeView areas={selectAreaList()} />` and feeds Home its data) needs T010, T011, T013 → **T015** (`App` wiring) needs T014. Import graph: `HomeView` → `idaf.ts` only; `registry.ts` → `HomeView` + 6 leaf views + `idaf.ts`; `router.tsx` → `registry.ts` + `HomeView` + `AppLayout`. No import cycle; `MODULE_REGISTRY` stays the only area list.
- T016 needs T011. T017 needs T010 + T011 (`selectAreaList`). T018 needs T012.
- T019–T021 and T035 need T015 (T035 also needs T012). T022 needs T008. T023 needs T022 (it verifies the copy T022 finalizes; transitively T009). T024 needs T015. T025 → T026 (needs T014) → T027; T028 needs T014 (`*` route) + T015.
- T030 needs T015 (+ T026 for the error path). T031 needs every test task. T032–T034 need T015.

### Parallel opportunities

- Phase 1: T002, T003, T004, T005 together after T001.
- Phase 2: T006 and T007 together; T008 then T009.
- Phase 3: **T010 runs in parallel with T008/T009** (it depends only on `src/content/idaf.ts`). After T011, T012 → T013 → T014 are sequential (registry → nav → layout → router). The three unit tests T016 / T017 / T018 run together once their targets exist.
- Phase 4: T019, T020, T021, T035 are independent of each other (four separate e2e spec files, no shared state).
- Phase 5: T023 and T024 run together after T022.
- Phase 6: T027 and T028 run together after T026.
- Phase 7: T029 and T034 are independent; T032 and T033 are manual and can run in parallel by different people.
- Once Phase 3 is merged, Phase 4, Phase 5 and Phase 6 can proceed in parallel.

---

## Parallel Example: Phase 3 tests

```bash
# After T010 (HomeView), T011 (registry), T012 (PrimaryNav) exist:
npm run test registry       # T016
npm run test home-view      # T017
npm run test primary-nav    # T018
```

## Parallel Example: Phase 4

```bash
# All four are separate spec files with no shared state:
npm run test:e2e navigation         # T019
npm run test:e2e repeat-and-rapid   # T020
npm run test:e2e reload             # T021
npm run test:e2e a11y-nav           # T035
```

---

## Implementation Strategy

### MVP first

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1), following the acyclic chain content/types → `HomeView` → `registry` → `PrimaryNav` → `AppLayout` → `router` (feeds `HomeView` its `areas`) → `App`.
2. **Stop and validate**: `npm run dev` opens on a truthful Home screen; `registry` / `home-view` / `primary-nav` unit tests pass. This is a demoable increment.

### Incremental delivery

1. Setup + Foundational → shell builds and the smoke test runs.
2. + US1 → Home + registry-derived navigation (MVP).
3. + US2 → navigation proven under repetition / speed / strict reload (`/topologia` → reload → `/topologia`).
4. + US3 → six honest pending-module views.
5. + Routes/Errors → unknown route redirects to Inicio, section failure shows `RouteError`.
6. + Polish → static build verified; **mandatory**: automated suite (T031) + CA-01…CA-12 (T032) all "Sí". **Non-blocking**: SC-005 comprehension check (T033) and SC-006 long-session observation (T034) recorded as usability feedback.

---

## Coverage review — Functional Requirements

*(Task roles after the acyclic fix: T010 = `HomeView` (props-driven), T011 = `registry.ts` + `selectAreaList` + `HomeRoute`, T012 = `PrimaryNav`, T013 = `AppLayout`, T014 = `router.tsx`, T015 = `App` wiring.)*

| FR | Tasks |
|----|-------|
| FR-001 | T010, T014, T015, T017, T019 |
| FR-002 | T007, T010, T017 |
| FR-003 | T007, T010, T017 |
| FR-004 | T010, T011, T012, T017 |
| FR-005 | T007, T010, T011, T016, T017 |
| FR-006 | T011, T012, T014, T016, T018 |
| FR-007 | T011, T012, T016, T018 |
| FR-008 | T012, T013, T019 |
| FR-009 | T012, T014, T018, T019 |
| FR-010 | T014, T019 |
| FR-011 | T014, T019, T030 |
| FR-012 | T010, T011, T012, T014, T019, T022, T023 |
| FR-013 | T020 |
| FR-014 | T020 |
| FR-015 | T009, T011, T014, T023 |
| FR-016 | T007, T008, T022, T023 |
| FR-017 | T008, T022, T023, T024 |
| FR-018 | T008, T022, T023 |
| FR-019 | T010, T017, T024 |
| FR-020 | T025, T026, T027, T034 |
| FR-021 | T025, T026, T027 |
| FR-022 | T014, T028, T030 |
| FR-023 | T015 (app opens with no auth gate), T019 (positive check: no login form/gate at `/`) |
| FR-024 | T032, T033 (whole flow driven from the UI, no console/editing) |
| FR-025 | T007, T011, T016, T018 (single list `MODULE_REGISTRY` + `selectAreaList` feed both Home and nav) |
| FR-026 | T024, T031 + scope guardrails on T008 / T009 / T022 |
| FR-027 | T014 (`createBrowserRouter`, clean URLs), T021 (reload + direct URL keeps the area), T030 (build + hard reload on `/topologia`) |
| FR-028 | T012, T018, T035 |
| FR-029 | T012, T018, T019, T035 |
| FR-030 | T012, T018, T035 |
| FR-031 | T012, T035 |

## Coverage review — Success Criteria

| SC | Tasks |
|----|-------|
| SC-001 | T011, T016, T017, T018 |
| SC-002 | T019, T030 |
| SC-003 | T019, T030 |
| SC-004 | T016, T023, T024 |
| SC-005 (no bloqueante) | T010, T017, T033 (T033 is the non-blocking five-question human-judgement check) |
| SC-006 (parte automatizada = bloqueante) | T020, T031 |
| SC-006 (observación manual prolongada = no bloqueante) | T034 |
| SC-007 | T020 |
| SC-008 | T032 (against `spec.md` §"Criterios de aceptación (CA-01 … CA-12)") |

## Coverage review — Edge cases

| Edge case | Tasks |
|-----------|-------|
| EC-01 Selección repetida del módulo actual | T020 |
| EC-02 Navegación rápida entre módulos | T020, T034 |
| EC-03 Módulo sin funcionalidad (nunca vacío / error / volcado) | T008, T022, T023 |
| EC-04 Fallo al mostrar una sección | T025, T026, T027 |
| EC-05 Ruta / destino desconocido | T014, T028 |
| EC-06 Recarga estando en un módulo (FR-027) | T021, T030 |

**Result**: every FR (FR-001 … FR-031), every Success Criterion (SC-001 … SC-008, blocking and non-blocking parts) and every edge case (EC-01 … EC-06) listed in the spec has at least one associated task. No task introduces behaviour outside SPEC 001.
