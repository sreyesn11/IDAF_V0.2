# IDAF — Fundación funcional (SPEC 001)

Cáscara navegable de IDAF: una SPA que arranca en una pantalla de **Inicio**
funcional, expone las **siete áreas funcionales** en una navegación principal
siempre visible y muestra una vista propia de "funcionalidad no disponible" para
los seis módulos aún no implementados. Sin backend, autenticación, persistencia
ni datos de dispositivos.

## Prerrequisitos

- Node.js 20 LTS y npm.
- Sin variables de entorno, sin servicios externos, sin credenciales.

## Puesta en marcha

```bash
npm install
npm run dev          # servidor de desarrollo Vite (imprime la URL, p. ej. http://localhost:5173)
```

## Build y previsualización del artefacto estático

```bash
npm run build        # genera dist/ (bundle estático) tras verificar tipos
npm run preview      # sirve dist/ en http://localhost:4173 con fallback SPA a index.html
```

> **Despliegue**: al usar rutas limpias (`BrowserRouter`), el hosting debe servir
> `index.html` para cualquier ruta profunda (`/topologia`, etc.). `npm run preview`
> ya lo hace. Si el hosting objetivo no lo permite, cambiar a `HashRouter`
> (sustitución directa, sin tocar vistas).

## Pruebas

```bash
npm run test         # Vitest + React Testing Library (unitarias / de componente)
npm run test:e2e     # Playwright (chromium, firefox, webkit): navegación, recarga,
                     # alternancia rápida, accesibilidad de la navegación, rutas
```

`npm run test:e2e` levanta por sí solo el servidor (`npm run build && npm run preview`)
antes de ejecutar. La primera vez, instalar los navegadores: `npx playwright install`.

## Estructura

- `src/content/idaf.ts` — **fuente única** de todo el texto visible (nombre,
  propósito, etiquetas de las siete áreas, estados, mensajes).
- `src/modules/registry.ts` — **lista única** de las siete áreas; navegación,
  lista de Inicio y rutas se derivan de aquí.
- `src/app/` — núcleo de la cáscara (layout persistente, router, vistas de error).
- `src/modules/<área>/` — una carpeta autocontenida por área.

Ver `specs/001-idaf-foundation-navigation/` para la especificación, el plan y los
contratos.
