---
description: "Task list for SPEC 002 — Experiencia visual, navegación y acceso de usuario de IDAF"
---

# Tasks: Experiencia visual, navegación y acceso de usuario de IDAF

**Input**: Design documents from `/specs/002-visual-identity-design/`

**Prerequisites**: plan.md, spec.md, research.md (D1–D15), data-model.md, contracts/ (auth-and-session.md, navigation-and-routes.md, visual-system.md), quickstart.md

**Tests**: INCLUDED — the spec, plan §Testing, research D15 and quickstart §4 explicitly define named Vitest + Playwright suites mapped to SC-001…SC-038. Test tasks are therefore first-class here.

**Organization**: Tasks are grouped by user story. Phase 1 (Setup) and Phase 2 (Foundational) are shared prerequisites; every user story (US1–US7) then has its own phase and is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1…US7 — the user story the task serves (Setup/Foundational/Polish carry no story label)
- Every task names exact file paths (repository root = `idaf_project/`)

## Path Conventions

Single project at repository root. Frontend in `src/`, tests in `tests/`, minimal auth service in `server/`, helper scripts in `scripts/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire the build, the dev/preview proxy, the two-environment test runner (incl. the jsdom shims in `tests/setup.ts`) and the secret-free configuration surface. No product code yet.

- [X] T001 [P] Add `auth` and `auth:seed` npm scripts (start service / seed dev accounts) to [package.json](package.json); confirm NO new runtime dependencies are added (Principio VI)
- [X] T002 [P] Add `/api` → auth service (`http://localhost:8787`) to `server.proxy` and `preview.proxy` in [vite.config.ts](vite.config.ts) so the browser sees one origin
- [X] T003 [P] Configure a two-environment Vitest run — jsdom for `tests/unit/**` and a `node` project for `tests/unit/auth-service.test.ts` (`server/`) — via a `test.projects` block in [vite.config.ts](vite.config.ts) (or a new `vitest.workspace.ts`)
- [X] T004 [P] Convert Playwright `webServer` to a list (auth service on 8787 with `GET /health` wait + `vite preview` on 4173) and point `IDAF_ACCOUNTS_FILE` at `tests/fixtures/accounts.e2e.json` in [playwright.config.ts](playwright.config.ts). (The `globalSetup` that auto-seeds the accounts fixture — file + config key — is added in T012, alongside the seed script it calls.)
- [X] T005 [P] Create [.env.example](.env.example) with `IDAF_AUTH_PORT=8787`, `IDAF_ACCOUNTS_FILE=`, commented `IDAF_ACCOUNTS=` — no real values (contract auth-and-session §B)
- [X] T006 [P] Create/extend [.gitignore](.gitignore) to ignore `.env`, `server/accounts.dev.json`, `tests/fixtures/accounts.e2e.json`
- [X] T007 [P] Exclude `server/**` and `scripts/**` (`.mjs`, native Node) from `tsc --noEmit` in [tsconfig.json](tsconfig.json) / [tsconfig.node.json](tsconfig.node.json)
- [X] T081 [P] Update [tests/setup.ts](tests/setup.ts) with the jsdom shims every SPEC 002 unit suite needs — `sessionStorage`, `matchMedia`, and `visibilitychange`/`focus` events — so the session and visual-criteria tests can run. **Ordered here in Setup (not Polish)** because T033, T040 and T051 depend on it; ID kept low for traceability with the prior `/speckit-analyze`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The authentication boundary, the session layer, the protected router and the shared visual system. Nothing in US1–US7 can be built until this phase is complete — every story requires a session and the token/icon foundation.

**⚠️ CRITICAL**: No user story work begins until this phase is done.

### Minimal authentication service (`server/`, Node 20 ESM, native modules only)

- [X] T008 [P] Create [server/accounts.example.json](server/accounts.example.json) — placeholder catalog entries only (`username`, `displayName`, `salt`, `passwordHash` placeholders), no real material
- [X] T009 [P] Implement the catalog loader + credential verifier in [server/accounts.mjs](server/accounts.mjs): read `IDAF_ACCOUNTS_FILE` or `IDAF_ACCOUNTS` at startup; schema-validate (≥1 entry, unique `username`, hex `salt`/`passwordHash`); explicit startup error if absent/malformed; `verify(username, password)` via `crypto.scrypt` + `crypto.timingSafeEqual`, with a fixed-salt dummy `scrypt` when the user is unknown to keep timing comparable (contract §A1.1–A1.2, §B)
- [X] T010 Implement the HTTP service in [server/index.mjs](server/index.mjs) using `node:http`: `POST /api/auth/login` (200 `{user}` + `Set-Cookie: idaf_sid=…; HttpOnly; SameSite=Strict; Path=/` session cookie / 401 `{error:"invalid_credentials"}` / 400 `{error:"bad_request"}` / 503 `{error:"unavailable"}`), `GET /api/auth/session` → `{authenticated, user?}`, `POST /api/auth/logout` → 204 + cookie clear, `GET /health` → `{status:"ok"}`; in-memory `Map` session store (`sessionId`=`randomBytes(32).base64url`); never write `username`/`password`/hash to stdout (contract §A) — depends on T009
- [X] T011 [P] Create [scripts/hash-account.mjs](scripts/hash-account.mjs) — prints `{ "salt", "passwordHash" }` (`scrypt`) for a password argument (contract §B, quickstart §2)
- [X] T012 [P] Create [scripts/seed-dev-accounts.mjs](scripts/seed-dev-accounts.mjs) — **idempotent** (safe to re-run; output byte-stable across runs), generates git-ignored `server/accounts.dev.json` and `tests/fixtures/accounts.e2e.json` with **≥2** disposable non-secret accounts (FR-052), one with a `displayName` ≥40 chars (SC-020); prints the plaintext dev credentials. Also create [tests/e2e/global-setup.ts](tests/e2e/global-setup.ts) — a Playwright `globalSetup` that invokes this seed logic to (re)create `tests/fixtures/accounts.e2e.json` when absent — **and** add `globalSetup: './tests/e2e/global-setup.ts'` to [playwright.config.ts](playwright.config.ts) so every E2E invocation (`npm run test:e2e`, `npx playwright test`, IDE) self-seeds; no remembered manual `npm run auth:seed`. Runs in Phase 2, after Phase 1 T004 has restructured that config file — depends on T004
- [X] T013 [P] Create [server/README.md](server/README.md) — configuring the catalog, generating hashes, and an explicit note that the seeded dev credentials are NOT secret (contract §B4)

### Shared frontend foundations

- [X] T014 [P] Extend the single text source [src/content/idaf.ts](src/content/idaf.ts): login purpose text, field labels, submit label, `auth.invalidCredentials`, `auth.unavailable`, session-bar strings, "Cerrar sesión", nav `aria-label`, per-area `description`, `statusText.unavailable` body/`unavailableBody` (FR-025, FR-049; Principio XI)
- [X] T015 [P] Create design tokens [src/styles/tokens.css](src/styles/tokens.css): `--color-identity*`, neutrals (`--color-bg/surface/surface-raised/border/text/text-muted`), 4 semantic families (`ok/warn/error/info` × base/bg/text), type scale (`<h1>` ≤2.0× body, body `line-height` ≥1.4), `--space-*`, `--radius-*`, `--focus-ring` (≥3px, ≥3:1), `--motion-fast` ≤150ms, `--layout-min-width: 1024px` (contract visual-system §1; FR-037/038/040/042)
- [X] T016 [P] Create [src/styles/base.css](src/styles/base.css): light reset, base typography from tokens, landmark defaults, global `:focus-visible` ring (contract visual-system §1.3)
- [X] T017 [P] Create [src/components/icons/paths.ts](src/components/icons/paths.ts): ~16 icons on ONE 24×24 grid / ONE stroke width — `home, inventory, discovery, connections, diagnostics, topology, observability` (nav), `brand` (original nodes/connectivity symbol — **provisional placeholder created here in Foundational so `Brand` (T024) can render; the definitive mark is finalized in T042 (US2)**), `user`, `logout`, `status-ok/-warn/-error/-info`, `password-show/-hide` (contract visual-system §2; FR-019/020/028)
- [X] T018 Create [src/components/icons/index.tsx](src/components/icons/index.tsx): `IconName` union + `<Icon name title? className? />` (`role="img"` + `<title>` when `title` given, else `aria-hidden="true"`) — depends on T017
- [X] T019 Extend [src/modules/types.ts](src/modules/types.ts): `FunctionalArea` gains `icon: IconName` and `description?: string` (data-model §5) — depends on T018
- [X] T020 Extend [src/modules/registry.ts](src/modules/registry.ts): every entry sets a unique `icon` (from the one family) and a `description`; keep `MODULE_REGISTRY` as the sole source and `selectAreaList` intact — depends on T019, T014
- [X] T021 [P] Create [src/auth/authClient.ts](src/auth/authClient.ts): `login()/fetchSession()/logout()` via `fetch('/api/auth/*', { credentials: 'same-origin' })`; map 200→`{ok:true,user}`, 401/400→`{ok:false,reason:'invalid_credentials'}`, 5xx/network/timeout→`{ok:false,reason:'unavailable'}`; NO hashing, catalog, verifier or storage; relative URL only (contract §C)
- [X] T022 Create [src/auth/SessionProvider.tsx](src/auth/SessionProvider.tsx) + [src/auth/useSession.ts](src/auth/useSession.ts): `SessionState` = `anonymous | authenticated{user} | loading`; `login()` writes only `sessionStorage['idaf.session'] = {username,displayName}` then `authenticated`; `logout()` clears marker → `anonymous`; rehydrate on mount via `authClient.fetchSession()` when marker present; revalidate on `visibilitychange`/`focus` → `anonymous` if `authenticated:false` (network error does NOT drop session); no timers/expiry (contract §D; FR-009/011/013/051/057/058) — depends on T021
- [X] T023 Create [src/app/RequireSession.tsx](src/app/RequireSession.tsx): `anonymous` → `<Navigate to="/login" replace />` (mounts no `AppLayout`/area); `authenticated` → `<AppLayout/>` with `<Outlet/>`; `loading` → minimal neutral placeholder (contract §E; FR-001/008/010) — depends on T022
- [X] T024 [P] Create shared [src/components/Brand.tsx](src/components/Brand.tsx): `<Icon name="brand" aria-hidden />` + "IDAF" text; used identically by Login and the AppShell header (contract visual-system §3.1; FR-028/029) — depends on T018
- [X] T025 Restructure [src/app/AppLayout.tsx](src/app/AppLayout.tsx) into the AppShell with landmarks and create [src/app/AppLayout.css](src/app/AppLayout.css): `<header>` (`banner`) with `Brand` + a session slot, `<nav aria-label>` side column slot, `<main>` with a `ModuleHeader` slot + `<Outlet/>`; CSS grid, four stable zones, `--layout-min-width` (contract navigation-and-routes §4; FR-031/034/046) — depends on T024, T020
- [X] T026 Split [src/app/router.tsx](src/app/router.tsx): public `/login` (temporary inline placeholder element, no shell) + protected tree under `<RequireSession>`; area routes still `MODULE_REGISTRY.map(...)`; protected `*` → `<Navigate to="/" replace />`; keep `errorElement={<RouteError/>}` (contract navigation-and-routes §1–2; research D4) — depends on T023, T025. **Implemented directly with the real `<LoginView/>` (T037) rather than a temporary placeholder — T038 is therefore also satisfied.**
- [X] T027 Wrap the router with `<SessionProvider>` in [src/App.tsx](src/App.tsx) — depends on T022, T026
- [X] T028 [P] Create [tests/e2e/_session.ts](tests/e2e/_session.ts): `loginAs(page, account)` helper reading `tests/fixtures/accounts.e2e.json`
- [X] T029 Adapt the SPEC 001 E2E suites to log in first (navigation regression, Principio XII): [tests/e2e/_areas.ts](tests/e2e/_areas.ts), [tests/e2e/navigation.spec.ts](tests/e2e/navigation.spec.ts), [tests/e2e/reload.spec.ts](tests/e2e/reload.spec.ts), [tests/e2e/repeat-and-rapid.spec.ts](tests/e2e/repeat-and-rapid.spec.ts), [tests/e2e/a11y-nav.spec.ts](tests/e2e/a11y-nav.spec.ts), [tests/e2e/no-device-data.spec.ts](tests/e2e/no-device-data.spec.ts) — depends on T028

**Checkpoint**: Auth service runs, a session survives reload, protected routes redirect to `/login`, tokens/icons/registry are in place. User stories can now begin.

---

## Phase 3: User Story 1 — Acceder a IDAF mediante inicio de sesión (Priority: P1) 🎯 MVP

**Goal**: A login screen is the entry point; with valid credentials the user reaches Inicio, with invalid ones a generic message that never says which field failed, and a distinct message when verification could not be completed.

**Independent Test**: Open IDAF with no session → Login appears and no area is in the DOM; sign in with a valid dev account → Inicio with the 7-area nav; repeat with a wrong password, an unknown user and empty fields → still on Login, one generic message; stop the auth service and retry → a *different* "no se pudo verificar" message, no session; open `/login` while authenticated → redirected to Inicio without logging out.

### Tests for User Story 1

- [X] T030 [P] [US1] `tests/unit/auth-service.test.ts` (node env): catalog `scrypt` load; valid → identity; wrong password AND unknown user → identical `401`; empty fields → generic `401`; internal failure (catalog not loaded) → `503`, never `401`; session cycle (create → `session` recognizes → `logout` invalidates); no credentials in output; **exactly 10 consecutive failed logins** for one username each return the byte-identical generic `401` body — no lockout, no rate-limit/backoff state, no session created, no unexpected `4xx`/`5xx` — and an 11th call with the correct password still returns `200` + identity (behaviour stable after the burst) (FR-003–007, FR-052, FR-055, FR-056; CL-02)
- [X] T031 [P] [US1] [tests/unit/auth-client.test.ts](tests/unit/auth-client.test.ts) (mocked `fetch`): `login()` POST → `{ok:true,user}`; `401`/`400` → `invalid_credentials`; `5xx`/network/timeout → `unavailable`; `fetchSession()` GET; `logout()` POST; never another origin; stores no secret (FR-003/004/056)
- [X] T032 [P] [US1] [tests/unit/no-frontend-secrets.test.ts](tests/unit/no-frontend-secrets.test.ts): no module under `src/` imports `server/accounts*` or defines credential hashing/verification; scan `src/` for password/hash/salt patterns (FR-055; SC-025)
- [X] T033 [P] [US1] [tests/unit/session-provider.test.tsx](tests/unit/session-provider.test.tsx): `login`/`logout`; rehydration via `fetchSession()` + `sessionStorage` marker (marker holds only `{username,displayName}`); revalidation on `visibilitychange`/`focus` → `anonymous` when `authenticated:false`; redirect to `/` when already authenticated (FR-009/011/013/051/057/058)
- [X] T034 [P] [US1] [tests/unit/require-session.test.tsx](tests/unit/require-session.test.tsx): no session → `/login`; session → content; `loading` does not evict on reload (FR-001/008/010/014)
- [X] T035 [P] [US1] [tests/unit/login-view.test.tsx](tests/unit/login-view.test.tsx): IDAF name + purpose + user field + password field + visible submit; `invalid_credentials` message does not name the failed field; `unavailable` message is distinct; focus moves to the message or stays in the form on failure (FR-002/004–006/054/056)
- [X] T036 [P] [US1] [tests/e2e/auth-login.spec.ts](tests/e2e/auth-login.spec.ts): no session → Login (no area nav in DOM); valid → Inicio; wrong/unknown/empty → generic message, still on Login; **10 consecutive wrong attempts** → the same generic message every time, still on Login, no lockout, no console error, then a valid attempt logs in normally (FR-007; CL-02); logging in as a **second predefined account** yields the identical AppShell, the same 7 nav entries and the same reachable areas — only `displayName` differs, no role/permission gating (FR-016); service stopped → distinct "no se pudo verificar" message, no session/marker (SC-027); `/login` with active session → Inicio, session still `authenticated` (SC-028); **SC-002 measured explicitly** — `t0` = the instant the valid-credentials **Iniciar sesión** submit is triggered, `t1` = the instant the Inicio `<h1>` holds focus AND the 7-area nav is visible, both read from the Playwright test-runner clock; hard assertion `elapsed = t1 − t0 < 30000` ms and the test FAILS if the threshold is exceeded (spec §«Evaluación con personas» → «Medición de tiempos»; quickstart E2) (SC-001/002/003)

### Implementation for User Story 1

- [X] T037 [US1] Create [src/modules/login/LoginView.tsx](src/modules/login/LoginView.tsx) + [src/modules/login/LoginView.css](src/modules/login/LoginView.css): `Brand` + purpose text + `Usuario` + `Contraseña` (show/hide toggle icon) + `Iniciar sesión` `<button type="submit">`; trims `username`; empty field → required hint WITHOUT calling `login()`; on `login()` result choose message by `reason` in a `role="alert"` container; focus: mount → user field, failure → alert (or stays in form), success → navigate `/` (`replace`); redirect to `/` if already `authenticated`; disable submit while pending (contract auth-and-session §F) — depends on T022, T024, T018, T014, T015
- [X] T038 [US1] Replace the placeholder `/login` element with `<LoginView/>` in [src/app/router.tsx](src/app/router.tsx) and move focus to the Inicio view `<h1>` after a successful login (research D5) — depends on T037, T026

**Checkpoint**: US1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 — Reconocer el producto y recibir una experiencia visual definitiva (Priority: P1)

**Goal**: On the login screen and inside the app the product reads immediately as **IDAF** (name + original nodes/connectivity symbol) and as a technical network/IoT diagnostics & observability tool — the same product in both places, not a generic admin template or an unfinished prototype.

**Independent Test**: Show Login and Inicio without the URL to reviewers → they name the product "IDAF", describe it as a network/IoT/diagnostics tool and recognize both screens as one product; the automated scan in this phase covers **Login + Inicio** and confirms FR-027 (a)–(e) are all present with no purely decorative imagery or looping animation (the all-7-areas sweep runs in US5/US6, not here).

### Tests for User Story 2

- [X] T039 [P] [US2] [tests/unit/tokens.test.ts](tests/unit/tokens.test.ts): identity, neutral and all 4 semantic families exist as custom properties; type scale within limits (`<h1>` ≤2.0× body, body `line-height` ≥1.4, `--motion-fast` ≤150ms) (FR-037/040/042; SC-034/035)
- [X] T040 [P] [US2] [tests/unit/visual-criteria.test.tsx](tests/unit/visual-criteria.test.tsx): computed-style scan on **Login and Inicio, asserting only what already exists in US2** — no decorative `<img>`/`background-image`/`<svg>`/`<canvas>`; every `transition`/`animation-duration` ≤150ms and `animation-iteration-count` finite; content `line-height` ≥1.4; `<h1>` ≤2× body; hit-target ≥24×24 (SC-032/033/034/035; FR-030/042). Checks that depend on `ModuleHeader`, `Surface`, the final Inicio layout, or a vertical gap measured relative to `ModuleHeader` height are **explicitly deferred to T060 / T066 (US5)** and are NOT asserted here. This task takes **no dependency on any later phase**; the all-7-areas sweep is T060 (US5) + T068 (US6) + the Polish global pass T089
- [X] T041 [P] [US2] [tests/e2e/product-identity.spec.ts](tests/e2e/product-identity.spec.ts): IDAF name + `brand` symbol on **Login and Inicio**; those two share identity/typography/palette/icons/control treatment; the four zones are distinguishable; Login carries brand + purpose + the same button/error components and zero decorative adornments. **FR-027 (a)–(c)** (brand identity, colour-role system, one icon family) are asserted here; **FR-027 (d)** consistent module header and **(e)** surface/card treatment depend on `ModuleHeader`/`Surface` and are **deferred to T060 / T066 (US5)** — not asserted in this phase (SC-006/007/017/036/037). **No dependency on any later phase.** The definitive all-7-areas FR-036 cross-review (divergence = 0) is the Polish pass T089; T060 (US5) covers Inicio + shell, T068 (US6) the 6 "No disponible" views

### Implementation for User Story 2

- [X] T042 [US2] Finalize the `brand` symbol in [src/components/icons/paths.ts](src/components/icons/paths.ts) (original, simple nodes/connectivity mark) and confirm `Brand` is rendered by the exact same component in [src/modules/login/LoginView.tsx](src/modules/login/LoginView.tsx) and the [src/app/AppLayout.tsx](src/app/AppLayout.tsx) header (FR-028/029) — depends on T024, T037
- [X] T043 [US2] Import [src/styles/tokens.css](src/styles/tokens.css) + [src/styles/base.css](src/styles/base.css) once in [src/main.tsx](src/main.tsx); make Login and internal controls (button, error container) use the same shared components/tokens — the login form must not have a distinct style (FR-029/036; contract auth-and-session §F7) — depends on T015, T016, T037
- [X] T044 [US2] Sweep Login + AppShell for FR-030 compliance: `<main>` is the largest surface, no purely decorative graphics, only ≤150ms state microtransitions (no loops) — adjust [src/app/AppLayout.css](src/app/AppLayout.css) / [src/modules/login/LoginView.css](src/modules/login/LoginView.css) as needed (FR-030/034; SC-018/032/033)

**Checkpoint**: US1 + US2 both work; the product is recognizably IDAF on Login and inside.

---

## Phase 5: User Story 3 — Navegar por las siete áreas con nombre, icono y estado activo inequívoco (Priority: P1)

**Goal**: The authenticated user sees exactly seven areas, each with a visible name and a distinguishable icon from one visual family; the icon complements the text, never replaces it; exactly one area is active, marked by ≥2 simultaneous visual signals of which ≥1 is non-chromatic.

**Independent Test**: Authenticate, walk the 7 areas → each shows name + icon, all icons are one family evoking their concept, exactly one is active at all times; hide icons via CSS → still usable by name; rapidly toggle ≥20 times → never more than one active, no duplicated content.

### Tests for User Story 3

- [X] T045 [P] [US3] Rewrite [tests/unit/primary-nav.test.tsx](tests/unit/primary-nav.test.tsx): 7 entries icon + visible name; one family; active state = ≥2 rendered properties, ≥1 non-chromatic; exactly one active; name still identifies the entry with the icon hidden; unique `(label, icon)` (FR-018–026; SC-031/038)
- [X] T046 [P] [US3] Extend [tests/unit/registry.test.ts](tests/unit/registry.test.ts): keep prior invariants + every entry has a valid `icon` present in the icon map; the 7 icons are 7 distinct values of the same family; `(label, icon)` unique, no duplicate entries (FR-017/019/020/025; SC-038)
- [X] T047 [P] [US3] [tests/e2e/nav-icons-active.spec.ts](tests/e2e/nav-icons-active.spec.ts): 7 areas icon + name; one family; exactly one active per view; active differs by ≥2 rendered properties, ≥1 non-chromatic and still perceptible under an achromatopsia emulation; ≥20 rapid toggles with no double-active / no duplicated content; icons hidden → still usable (FR-026; SC-010/011/012/013/031)

### Implementation for User Story 3

- [X] T048 [US3] Rewrite [src/components/PrimaryNav.tsx](src/components/PrimaryNav.tsx): one `NavLink` per `MODULE_REGISTRY` entry (order `order`), `<Icon name={area.icon} aria-hidden />` + visible `area.label`; `<nav aria-label={idaf...}>`; `end` on `/`; `aria-current="page"` from `NavLink`; no session identity/logout here (FR-026; contract navigation-and-routes §3) — depends on T020, T018
- [X] T049 [US3] Rewrite [src/components/PrimaryNav.css](src/components/PrimaryNav.css): normal / hover / active / `:focus-visible` / disabled by token; active = solid accent bar (shape) + distinct `font-weight` (both non-chromatic) + identity text color + raised surface (contract visual-system §4) — depends on T048, T015
- [X] T050 [US3] Mount `<PrimaryNav/>` in the AppShell `<nav>` zone of [src/app/AppLayout.tsx](src/app/AppLayout.tsx), visually separated from the session slot (FR-015 boundary) — depends on T048, T025

**Checkpoint**: US1–US3 (all P1) complete — authenticated navigation is clear and unambiguous.

---

## Phase 6: User Story 4 — Identificar la sesión activa y cerrar sesión de forma explícita (Priority: P2)

**Goal**: While the session is active a visible session indicator and the user's `displayName` are shown, plus a visible, clearly identifiable **Cerrar sesión** action reachable from any of the seven areas; logout ends the session and returns to Login, and other tabs on the same session stop allowing internal use on reactivate/reload.

**Independent Test**: Authenticate; from several areas locate the user identity and the logout action; log out → back to Login, `GET /api/auth/session` → `{authenticated:false}`, internal route → Login; with two tabs, logout in one → the other shows Login on focus and on reload.

### Tests for User Story 4

- [X] T051 [P] [US4] [tests/unit/session-bar.test.tsx](tests/unit/session-bar.test.tsx): visible identity + "Cerrar sesión"; grouped in a `Sesión` region, separated from `<nav>`; long `displayName` truncates (ellipsis + `title`) without shifting layout (FR-012/015/045)
- [X] T052 [P] [US4] [tests/e2e/session-logout.spec.ts](tests/e2e/session-logout.spec.ts): identity + logout visible from all 7 areas; logout from `/diagnosticos` → service invalidates session + clears cookie → Login, focus on user field; then `/inventario` → Login (SC-004/008/009)
- [X] T053 [P] [US4] [tests/e2e/multi-tab-logout.spec.ts](tests/e2e/multi-tab-logout.spec.ts): two contexts sharing the session cookie; logout in A → B shows `/login` on reactivate (`visibilitychange`/`focus`) and on reload; no later navigation in B reaches internal areas (SC-029; CL-11)

### Implementation for User Story 4

- [X] T054 [US4] Create [src/components/SessionBar.tsx](src/components/SessionBar.tsx) + [src/components/SessionBar.css](src/components/SessionBar.css): container `aria-label="Sesión"` inside `<header>`; `<Icon name="user" aria-hidden />` + `displayName` (`max-width` + `text-overflow: ellipsis` + `title`); `<button type="button">` "Cerrar sesión" with `<Icon name="logout" aria-hidden />` → `useSession().logout()` then navigate `/login` (`replace`); keyboard operable, accessible name/role (contract visual-system §3.3; FR-011/012/015/045) — depends on T022, T018, T014
- [X] T055 [US4] Mount `<SessionBar/>` in the AppShell `<header>` beside `Brand`, with a treatment visually distinct from `<nav>` so logout cannot be read as a module action, in [src/app/AppLayout.tsx](src/app/AppLayout.tsx) (FR-015; SC-009) — depends on T054, T025
- [X] T056 [US4] Focus handoff on logout → Login `Usuario` field (research D5), implemented across [src/auth/SessionProvider.tsx](src/auth/SessionProvider.tsx) / [src/modules/login/LoginView.tsx](src/modules/login/LoginView.tsx) — depends on T054, T037

**Checkpoint**: The access cycle is complete — sign in, be identified, sign out from anywhere.

---

## Phase 7: User Story 5 — Encontrar una estructura y jerarquía visual consistentes en todas las áreas (Priority: P2)

**Goal**: Establish the shared structure — global nav, product identity, session context, content area, active indicator, a consistent module header — and the shared visual language (typography, spacing, title styles, iconography, active states, error messages, buttons) on **Inicio + the shell**, with the content area the largest region and ready for future operational content without redesign, no fake data now. The six "No disponible" views adopt this language in US6 (T069/T070); the definitive all-7-areas consistency judgement is T089 (Polish).

**Independent Test**: On **Inicio and the shell** → the four zones (global nav, product identity, session context, content) keep position and treatment across every route that renders the US5 shell; Inicio starts with a consistent `ModuleHeader`; the components finalized in US5 (`ModuleHeader`, `PrimaryNav`, `SessionBar`, `Brand`, `Surface`, `StatusBadge`) each resolve from one token / shared component / `base.css` rule; `<main>` is the largest surface; Inicio shows identity + purpose + 7-area overview with status and no operational data. The definitive all-7-areas FR-036 / SC-019 divergence = 0 judgement is deferred to **T089 (Polish)**, after US6 rebuilds the six "No disponible" views.

### Tests for User Story 5

- [X] T057 [P] [US5] [tests/unit/module-header.test.tsx](tests/unit/module-header.test.tsx): renders `<h1 tabIndex={-1}>{title}</h1>` + optional `<p>{description}</p>`; identical markup/tokens regardless of area (FR-031/032/033)
- [X] T058 [P] [US5] [tests/unit/status-badge.test.tsx](tests/unit/status-badge.test.tsx): each `kind` combines semantic color + `<Icon name={status-${kind}}/>` + text (never color alone); a disabled control shows opacity + `cursor:not-allowed` + `aria-disabled` and does not look available (FR-039/041)
- [X] T059 [P] [US5] Update [tests/unit/home-view.test.tsx](tests/unit/home-view.test.tsx): identity + purpose + 7-area overview with availability status from the registry; no operational data/metrics; uses `ModuleHeader`; primary nav still present (FR-059; SC-030)
- [X] T060 [P] [US5] [tests/e2e/structure-consistency.spec.ts](tests/e2e/structure-consistency.spec.ts): **scope = Inicio + the four shell zones** (global navigation, product identity, session context, content area). Assert: the four landmark zones are present and keep position/treatment across every route that renders the US5 shell; `<main>` is the largest surface; on Inicio + the shell chrome a consistent `ModuleHeader`, and the US5-final components (`ModuleHeader`, `PrimaryNav`, `SessionBar`, `Brand`, `Surface`, `StatusBadge`) each resolve from one `tokens.css` token / shared component / `base.css` rule (no divergence among the components finalized in US5); runtime SC-032/033/034/035 on Inicio and the shell chrome (SC-017/018). This task does **not** make the definitive all-7-areas / FR-036 / SC-019 judgement — that is **T089 (Polish)**, after US6 rebuilds the six "No disponible" views
- [X] T061 [P] [US5] [tests/e2e/home-overview.spec.ts](tests/e2e/home-overview.spec.ts): Inicio shows identity + brief explanation + 7-area overview with status; no tables/metrics/charts/operational values; `PrimaryNav` remains visible (SC-030)

### Implementation for User Story 5

- [X] T062 [P] [US5] Create [src/components/ModuleHeader.tsx](src/components/ModuleHeader.tsx): `<h1 tabIndex={-1}>{title}</h1>` + optional `<p>{description}</p>`, tokens only (contract visual-system §3.2) — depends on T015, T014
- [X] T063 [P] [US5] Create [src/components/Surface.tsx](src/components/Surface.tsx): card/surface treatment (`--color-surface*`, `--color-border`, `--radius-md`, spacing) with no data content (contract visual-system §3.4; FR-035) — depends on T015
- [X] T064 [P] [US5] Create [src/components/StatusBadge.tsx](src/components/StatusBadge.tsx): `kind ∈ {ok,warn,error,info}` → semantic family; always color + `<Icon name={status-${kind}} aria-hidden />` + text, pill shape (contract visual-system §3.5; FR-039) — depends on T018, T015
- [X] T065 [US5] Mount `<ModuleHeader/>` in the AppShell `<main>` zone and make its `<h1>` the post-login focus target (research D5) in [src/app/AppLayout.tsx](src/app/AppLayout.tsx) — depends on T062, T025
- [X] T066 [US5] Restyle [src/modules/home/HomeView.tsx](src/modules/home/HomeView.tsx): `ModuleHeader` + `idaf.purpose`; informative 7-area overview with availability status derived from `selectAreaList` (as list or `Surface` set); no operational data; does not replace `PrimaryNav` (FR-059; SC-030) — depends on T062, T063, T020

**Checkpoint**: The shell is a stable, consistent frame the next specs can build into.

---

## Phase 8: User Story 6 — Ver los módulos pendientes sin que aparenten estar disponibles (Priority: P2)

**Goal**: The six pending areas keep IDAF's identity and show the module icon + name + "No disponible" + a brief "coming later" explanation, with no charts, devices, metrics or fake buttons.

**Independent Test**: Open each of the 6 pending views → identity preserved, not an empty page, each contains icon + name + "No disponible" + explanation, and zero simulated elements (no `button`/`input`/`role=button`, no metric-looking numbers, no device-looking names).

### Tests for User Story 6

- [X] T067 [P] [US6] Update [tests/unit/module-unavailable.test.tsx](tests/unit/module-unavailable.test.tsx): renders `ModuleHeader` + module `<Icon>` + `StatusBadge kind="info"` "No disponible" + explanation `<p>`; no `button`/`input`/`form`/`select`/`role="button"`, no data tables, no metric-like values (FR-043/044)
- [X] T068 [P] [US6] [tests/e2e/unavailable-modules.spec.ts](tests/e2e/unavailable-modules.spec.ts): each of the 6 views keeps IDAF identity, shows module icon + name + "No disponible" + explanation, and has zero simulated elements (SC-014); and — now that these views are built in this phase — each of the 6 passes the SC-032/033/034/035 checks (no decorative graphics, animations ≤150ms with finite iteration, content `line-height` ≥1.4, `<h1>` ≤2× body, hit-target ≥24×24, no purposeless vertical gap >1.5× `ModuleHeader`) (FR-030/042). The cross-area FR-036 / SC-019 divergence = 0 judgement over all 7 areas is **T089 (Polish)**

### Implementation for User Story 6

- [X] T069 [US6] Rewrite [src/components/ModuleUnavailable.tsx](src/components/ModuleUnavailable.tsx) + create [src/components/ModuleUnavailable.css](src/components/ModuleUnavailable.css): `<section>` with `ModuleHeader title={areaLabel}`, `<Icon name={icon} title={areaLabel} />`, `StatusBadge kind="info"` with `idaf.statusText.unavailable`, and `<p>{idaf.unavailableBody}</p>`; forbid interactive/data elements (contract visual-system §3.6) — depends on T062, T064, T018, T014
- [X] T070 [P] [US6] Point the six pending views at `<ModuleUnavailable>` with their registry `icon` + `label`: [src/modules/inventory/InventoryView.tsx](src/modules/inventory/InventoryView.tsx), [src/modules/discovery/DiscoveryView.tsx](src/modules/discovery/DiscoveryView.tsx), [src/modules/connections/ConnectionsView.tsx](src/modules/connections/ConnectionsView.tsx), [src/modules/diagnostics/DiagnosticsView.tsx](src/modules/diagnostics/DiagnosticsView.tsx), [src/modules/topology/TopologyView.tsx](src/modules/topology/TopologyView.tsx), [src/modules/observability/ObservabilityView.tsx](src/modules/observability/ObservabilityView.tsx) — depends on T069, T020

**Checkpoint**: All seven areas render with one identity; six honestly say "No disponible".

---

## Phase 9: User Story 7 — Mantener acceso y navegación robustos en casos límite (Priority: P3)

**Goal**: Reloads, rapid module switching, a long user identifier, an oversized error message and a 1024 px window all leave the app usable and structurally intact, at a moderate information density.

**Independent Test**: Reload internal routes with and without a session; toggle modules fast; sign in with a ≥40-char `displayName`; force a ≥200-char error message; shrink the window to 1024 px — nav, session identity and logout stay visible and usable; everything interactive is keyboard-operable with visible focus.

### Tests for User Story 7

- [X] T071 [P] [US7] [tests/e2e/session-persistence.spec.ts](tests/e2e/session-persistence.spec.ts): reload an internal route with a session → same section, nav visible; reload a protected route with no session → Login; clear `sessionStorage` (tab-close simulation) + reload → Login (SC-005/024; CL-03/04/08)
- [X] T072 [P] [US7] [tests/e2e/edge-cases.spec.ts](tests/e2e/edge-cases.spec.ts): ≥40-char identifier does not shift/hide nav or content; ≥200-char error does not overlap controls; at 1024 px nav + session identity + "Cerrar sesión" remain visible and usable (SC-020/021)
- [X] T073 [P] [US7] [tests/e2e/keyboard-a11y.spec.ts](tests/e2e/keyboard-a11y.spec.ts): login form (incl. password toggle) + 7 nav entries + "Cerrar sesión" + section-error actions reachable/activatable by keyboard, no focus trap, visible focus; `banner`/`navigation`/`main` + named `Sesión` region present; focus relocates to Inicio `<h1>` on login, to the user field on logout, to the error message (or stays in form) on failure — in all three browsers (SC-022)
- [X] T074 [P] [US7] Update [tests/e2e/unknown-route.spec.ts](tests/e2e/unknown-route.spec.ts): with a session, unknown route → Inicio, no error/"not found"; without a session, a protected/unknown route → Login (SC-023; FR-053)

### Implementation for User Story 7

- [X] T075 [P] [US7] Harden long-identifier truncation in [src/components/SessionBar.css](src/components/SessionBar.css) (`max-width` + ellipsis + `title` with full value) (FR-045; SC-020)
- [X] T076 [P] [US7] Harden the error container in [src/modules/login/LoginView.css](src/modules/login/LoginView.css) (bounded width, line wrap, no overlap with fields/button) and confirm the internal-app error container matches (FR-047; SC-020)
- [X] T077 [P] [US7] Harden the 1024 px layout in [src/app/AppLayout.css](src/app/AppLayout.css) (nav may narrow but stays visible; session/logout stay reachable) (FR-046; SC-021)
- [X] T078 [US7] Finalize the wildcard rule in [src/app/router.tsx](src/app/router.tsx): with session `*` → `<Navigate to="/" replace />`, without session it falls through `RequireSession` → `/login` (FR-053; contract navigation-and-routes §2 R5–R6) — depends on T026
- [X] T079 [US7] Focus / keyboard pass across [src/modules/login/LoginView.tsx](src/modules/login/LoginView.tsx), [src/components/PrimaryNav.tsx](src/components/PrimaryNav.tsx), [src/components/SessionBar.tsx](src/components/SessionBar.tsx), [src/app/RouteError.tsx](src/app/RouteError.tsx): no focus trap, visible ring, accessible names/roles, `Enter` submits the login form (FR-054; SC-022) — depends on T037, T048, T054

**Checkpoint**: The experience holds up under non-ideal use without changing identity or structure.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Whole-product verification, docs and the constitution gate.

- [X] T080 [P] [tests/e2e/no-frontend-secrets.spec.ts](tests/e2e/no-frontend-secrets.spec.ts): build, then scan `dist/` for passwords / hashes / salts / a credential verifier / the account catalog — none present; `git ls-files` shows no real account file (SC-025)
- [X] T089 [P] Create [tests/e2e/global-consistency.spec.ts](tests/e2e/global-consistency.spec.ts) — the **final whole-product consistency pass, valid only after US5 + US6 are complete**: across **all 7 areas**, the FR-036 9-aspect cross-review (typography, spacing, title styles, nav behaviour, iconography, active states, error messages, buttons, general structure) with **global divergence count = 0** (each aspect resolves from the same `tokens.css` token / shared component / `base.css` rule in every area — SC-019); plus a runtime sweep of **SC-032 / SC-033 / SC-034 / SC-035** over the 7 area views **and** Login. This is the authoritative all-7 judgement that T060 (Inicio + shell, US5) and T068 (the 6 "No disponible" views, US6) deliberately stop short of — depends on all US5 and US6 tasks; runs in the T083 e2e block
- [X] T082 Run `npm test` (Vitest jsdom + node projects) and fix failures across all suites
- [ ] T083 Run `npm run test:e2e` (Chromium, Firefox, WebKit) and fix failures — includes the final `global-consistency.spec.ts` (T089); `globalSetup` (T012) seeds `tests/fixtures/accounts.e2e.json` automatically, no manual `auth:seed` step
- [X] T084 Run `npm run build` (`tsc --noEmit` + `vite build`) — verify the `icon`/`description` registry types and `authClient`/`SessionProvider` types compile
- [ ] T085 [P] Execute the [quickstart.md](quickstart.md) manual checklist: contrast WCAG 2.1 AA (SC-016), no-color perception (SC-015), and credential-log inspection over valid/invalid/unavailable logins (SC-026)
- [X] T086 [P] Update [README.md](README.md) and [package.json](package.json) `description`: two-process run (auth service + frontend), `.env` / `npm run auth:seed`, supported min width 1024 px
- [ ] T087 [P] Complete the human-panel evaluation per spec §«Evaluación con personas» (SC-006/007/009 blocking; SC-008/010/013 judgment) and record results in the PR
- [X] T088 Constitution re-check for the PR — the 12-principle table (esp. V, VI, VIII, XI, XII) per [plan.md](plan.md) §Constitution Check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Setup — **blocks every user story**
- **User Stories (Phases 3–9)**: all depend on Foundational
  - US1 (P1) — MVP, no dependency on other stories
  - US2 (P1) — extends the Login screen from US1 (T042/T043 touch `LoginView`); otherwise independent
  - US3 (P1) — independent (adds `PrimaryNav` to the shell)
  - US4 (P2) — independent (adds `SessionBar` to the shell); logout focus (T056) touches `LoginView`
  - US5 (P2) — independent (adds `ModuleHeader`/`Surface`/`StatusBadge`, restyles Home)
  - US6 (P2) — depends on US5 `ModuleHeader` + `StatusBadge` (T062, T064)
  - US7 (P3) — refinement over US1/US3/US4/US5 CSS + router
- **Polish (Phase 10)**: depends on all targeted stories being complete. T089 (`global-consistency.spec.ts`, the definitive all-7-areas FR-036 / SC-019 / SC-032–035 pass) specifically depends on **US5 and US6** being done — it is the successor to T060 (Inicio + shell) and T068 (the 6 "No disponible" views)

### Shared-file notes (sequential, not parallel)

- [src/app/AppLayout.tsx](src/app/AppLayout.tsx): T025 (skeleton) → T050 (US3 nav) → T055 (US4 session) → T065 (US5 header). Do these in story order.
- [src/app/router.tsx](src/app/router.tsx): T026 → T038 (US1) → T078 (US7).
- [src/modules/login/LoginView.tsx](src/modules/login/LoginView.tsx): T037 (US1) → T042/T043 (US2) → T056 (US4) → T076/T079 (US7).
- [src/components/icons/paths.ts](src/components/icons/paths.ts): T017 → T042 (brand finalization).
- [playwright.config.ts](playwright.config.ts): T004 (`webServer` list + `IDAF_ACCOUNTS_FILE`) → T012 (adds `globalSetup`). T012 is Phase 2, so it always runs after Phase 1 T004.

### Within each user story

- Tests are written first and expected to fail before implementation
- Models/types → components → shell mounting → focus/behavior wiring
- Story complete and checkpoint-verified before starting the next priority

---

## Parallel Execution Examples

### Phase 1 (Setup) — all parallel

```
T001 package.json scripts | T002 vite proxy | T003 vitest projects | T004 playwright webServer
T005 .env.example | T006 .gitignore | T007 tsconfig excludes | T081 tests/setup.ts jsdom shims
```

### Phase 2 (Foundational) — parallel groups

```
Group A (auth service):  T008 accounts.example.json | T009 accounts.mjs | T011 hash-account.mjs | T012 seed-dev-accounts.mjs | T013 server/README.md
Group B (frontend leaves): T014 idaf.ts | T015 tokens.css | T016 base.css | T017 icons/paths.ts | T021 authClient.ts
Then sequential: T010 (needs T009) ; T018→T019→T020 ; T022→T023 ; T024 ; T025→T026→T027 ; T028→T029
```

### User Story 1 — tests in parallel, then implementation

```
T030 auth-service.test | T031 auth-client.test | T032 no-frontend-secrets.test | T033 session-provider.test | T034 require-session.test | T035 login-view.test | T036 auth-login.spec
Then: T037 LoginView → T038 router wiring
```

### User Story 5 — components in parallel

```
T057 module-header.test | T058 status-badge.test | T059 home-view.test | T060 structure-consistency.spec | T061 home-overview.spec
T062 ModuleHeader | T063 Surface | T064 StatusBadge      (parallel)
Then: T065 mount header → T066 HomeView restyle
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1: Setup
2. Phase 2: Foundational (auth service + session layer + protected router + tokens/icons) — **critical, blocks everything**
3. Phase 3: User Story 1 — Login → Inicio, generic vs. unavailable messages, guarded routes
4. **STOP and validate**: run `auth-login.spec.ts` + the US1 unit suites; demo the login flow

### Incremental delivery

1. Setup + Foundational → foundation ready
2. + US1 → authenticated entry (MVP) → demo
3. + US2 → recognizable IDAF identity on Login and inside → demo
4. + US3 → clear icon + name navigation with an unambiguous active state → demo
5. + US4 → session identity + explicit logout (incl. multi-tab) → demo
6. + US5 → consistent shell structure + restyled Inicio → demo
7. + US6 → honest "No disponible" views → demo
8. + US7 → edge-case robustness + keyboard/a11y pass → demo
9. Polish → global 7-area consistency pass (T089), full test run, secret scan, manual checklist, constitution gate

### Parallel team strategy

After Foundational, the three P1 stories can proceed in parallel with a light merge discipline on `AppLayout.tsx` / `router.tsx` / `LoginView.tsx` (see Shared-file notes): Dev A → US1, Dev B → US3, Dev C → US2. US4/US5 follow; US6 waits on US5 primitives; US7 is a cross-cutting refinement pass.

---

## Notes

- `[P]` = different files, no dependency on an incomplete task
- `[Story]` labels (US1…US7) map each task to a spec user story for traceability
- Verify each test fails before implementing it
- Commit after each task or logical group
- The auth service (`server/`) is never imported by `src/`; the frontend talks to it only through `authClient` (FR-055)
- No real credentials, hashes or salts in the repo or `dist/` — dev/E2E accounts are seeded git-ignored and documented as non-secret
