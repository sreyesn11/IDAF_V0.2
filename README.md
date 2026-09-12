# IDAF — Experiencia visual, navegación y acceso de usuario (SPEC 002)

SPA de IDAF con **acceso autenticado**, **identidad visual definitiva** (marca,
color, tipografía, iconografía) y navegación con **icono + nombre** sobre las
siete áreas funcionales. Solo Inicio está implementado; las seis áreas
restantes muestran honestamente «No disponible». La validación de credenciales
ocurre en un **servicio de autenticación mínimo** aparte (`server/`); el
frontend nunca contiene contraseñas, hashes ni el catálogo de cuentas.

## Prerrequisitos

- Node.js 20 LTS y npm.
- Navegadores de Playwright para E2E: `npx playwright install`.

## Puesta en marcha (dos procesos)

```bash
npm install
npm run auth:seed          # genera cuentas de desarrollo desechables (no secretas)
npm run auth               # terminal 1 — servicio de autenticación (puerto 8787)
npm run dev                # terminal 2 — frontend (http://localhost:5173, proxy /api → 8787)
```

Primera pantalla esperada: **Login** (no Inicio). Las credenciales impresas por
`npm run auth:seed` son de desarrollo, no secretas — ver `server/README.md`.

Para usar un catálogo de cuentas real (fuera del repositorio):

```bash
cp .env.example .env
# editar .env: IDAF_ACCOUNTS_FILE=/ruta/fuera/del/repo/idaf-accounts.json
node scripts/hash-account.mjs "MI_CLAVE"   # genera { salt, passwordHash } para el catálogo
```

## Build y previsualización del artefacto estático

```bash
npm run build         # tsc --noEmit + vite build → dist/
npm run auth           # servicio de autenticación (terminal aparte)
npm run preview        # sirve dist/ en http://localhost:4173, proxy /api → 8787
```

> **Ancho mínimo soportado: 1024 px.** Por debajo, el soporte responsive
> completo queda fuera de alcance (FR-046).

> **Despliegue**: al usar rutas limpias (`BrowserRouter`), el hosting debe
> servir `index.html` para cualquier ruta profunda y proxyar `/api` hacia el
> servicio de autenticación.

## Pruebas

```bash
npm test           # Vitest: frontend (jsdom) + servicio de autenticación (entorno node)
npm run test:e2e   # Playwright (Chromium, Firefox, WebKit)
```

`npm run test:e2e` siembra por sí solo `tests/fixtures/accounts.e2e.json`
(globalSetup) y levanta el servicio de autenticación + `vite preview` — no hace
falta ejecutar `npm run auth:seed` a mano antes.

## Estructura

- `server/` — servicio de autenticación mínimo (Node 20 ESM, sólo módulos
  nativos). Nunca lo importa el frontend.
- `src/auth/` — `authClient` (único cliente HTTP del servicio),
  `SessionProvider`/`useSession` (estado de sesión + marcador no sensible en
  `sessionStorage`).
- `src/content/idaf.ts` — fuente única de todo el texto visible.
- `src/styles/tokens.css` — fuente única de los tokens de diseño (color,
  tipografía, espaciado, foco).
- `src/modules/registry.ts` — lista única de las siete áreas (icono +
  descripción incluidos); navegación, Inicio y rutas se derivan de aquí.
- `src/app/` — núcleo de la cáscara (AppShell, router con zona pública/protegida,
  guardián de sesión, vistas de error).
- `src/modules/<área>/` — una carpeta autocontenida por área.

Ver `specs/002-visual-identity-design/` para la especificación, el plan y los
contratos (y `specs/001-idaf-foundation-navigation/` para la base heredada).
