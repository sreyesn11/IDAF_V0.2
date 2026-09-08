# Registro de aceptación — SPEC 001 (CA-01 … CA-12)

**Fecha**: 2026-09-07
**Build verificado**: `npm run build` → `dist/` (index.html + assets); servido con `npm run preview` (fallback SPA activo).
**Suites**: `npm run test` → 53/53 ✓ · `npm run test:e2e` → 69/69 ✓ (chromium, firefox, webkit).

Cada criterio se responde **Sí / No** usando la aplicación. Referencia: `spec.md` →
*Criterios de aceptación (CA-01 … CA-12)*; mapeo de escenarios en `quickstart.md`.

| # | Criterio | Resultado | Evidencia |
|---|----------|-----------|-----------|
| CA-01 | Al abrir la aplicación aparece la pantalla de Inicio identificando el producto como IDAF. | **Sí** | `/` renderiza `<h1>IDAF</h1>`. `tests/unit/home-view.test.tsx` ("shows the product name IDAF"); `tests/e2e/navigation.spec.ts` ("primera carga de /"). |
| CA-02 | Inicio explica el propósito de IDAF (descubrimiento, gestión, diagnóstico y observabilidad de dispositivos de red e IoT). | **Sí** | `idaf.purpose` contiene los cuatro conceptos y "red e IoT". `tests/unit/home-view.test.tsx` ("explains the purpose with the four mandatory concepts and 'red e IoT'"). |
| CA-03 | Inicio lista las siete áreas con su estado de disponibilidad. | **Sí** | Lista de 7 `listitem`, cada uno con etiqueta + estado; "Disponible" ×1 (Inicio), "No disponible" ×6. `tests/unit/home-view.test.tsx`, `tests/unit/registry.test.ts` (`selectAreaList`). |
| CA-04 | La navegación principal con las siete áreas está visible y es utilizable desde cualquier área. | **Sí** | `<nav aria-label="Áreas de IDAF">` con 7 enlaces montado en `AppLayout` en toda ruta. `tests/unit/primary-nav.test.tsx`; `tests/e2e/navigation.spec.ts`, `tests/e2e/reload.spec.ts`, `tests/e2e/a11y-nav.spec.ts`. |
| CA-05 | Se puede ir de un módulo a otro sin pasar por Inicio. | **Sí** | De `/topologia` a `/inventario` en un clic, sin recarga de documento (flag `window` conservada). `tests/e2e/navigation.spec.ts` ("de Topología a Inventario en un paso, sin recarga de documento"). |
| CA-06 | Se puede volver a Inicio desde cualquier módulo sin recargar la aplicación. | **Sí** | Desde cada área, clic en "Inicio" → `/` + `<h1>IDAF</h1>`. `tests/e2e/navigation.spec.ts` ("se vuelve a Inicio desde cualquier área en un solo paso"). |
| CA-07 | Cada módulo pendiente tiene una vista propia identificada con su nombre. | **Sí** | Seis vistas (`InventoryView` … `ObservabilityView`), cada una `<h1>{etiqueta}</h1>`. `tests/unit/module-unavailable.test.tsx`; `tests/e2e/navigation.spec.ts`. |
| CA-08 | Cada módulo pendiente indica explícitamente que su funcionalidad todavía no está disponible y se incorporará más adelante. | **Sí** | `idaf.unavailableBody` = "…todavía no está disponible y se incorporará en una versión posterior de IDAF." `tests/unit/module-unavailable.test.tsx` ("states explicitly that the functionality is pending and will be added later"). |
| CA-09 | Ningún módulo pendiente muestra acciones falsas ni datos que aparenten dispositivos. | **Sí** | Vistas solo-texto: sin `button`/`input`/`form`/`select`/`a`/`role="button"`; sin IP/MAC/tabla en ninguna de las 7 rutas. `tests/unit/module-unavailable.test.tsx`; `tests/e2e/no-device-data.spec.ts`. |
| CA-10 | Reseleccionar el área activa no genera errores ni contenido duplicado. | **Sí** | 10 clics en la entrada activa → un solo `<h1>`, consola sin errores. `tests/e2e/repeat-and-rapid.spec.ts` ("reseleccionar el área activa 10 veces"). |
| CA-11 | Alternar rápidamente entre áreas deja visible solo la última, sin estados intermedios "pegados". | **Sí** | 24 alternancias → un solo `<h1>` (última área), la app responde a una navegación posterior, consola sin errores. `tests/e2e/repeat-and-rapid.spec.ts` ("alternar rápido 24 veces"). |
| CA-12 | Un destino desconocido no produce un error crudo; la aplicación redirige a Inicio. | **Sí** | `/ruta-inexistente` → `/` con Home y navegación visibles, sin "404"/"not found"/traza, historial reemplazado. `tests/e2e/unknown-route.spec.ts`. |

**Resultado**: 12 / 12 = **Sí**. SC-008 satisfecho.

## Validaciones no bloqueantes

- **T033 / SC-005** (comprensión del usuario < 3 min, cinco preguntas): **pendiente** —
  requiere una persona con perfil de redes/soporte sin exposición previa a IDAF. No
  bloquea la aceptación (juicio humano; `Assumptions` permite ajustar el texto de
  `src/content/idaf.ts`). Recomendado ejecutarlo en la revisión final.
- **T034 / SC-006 observación manual prolongada**: la parte automatizada
  (`repeat-and-rapid.spec.ts`, ≥ 20 alternancias, consola sin errores) está **verde**
  en los tres navegadores. La observación manual con DevTools abiertas queda como
  comprobación complementaria no bloqueante.
