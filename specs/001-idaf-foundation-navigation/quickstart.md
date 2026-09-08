# Quickstart — Validación de la Fundación funcional de IDAF

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) ·
**Contratos**: [contracts/](./contracts/)

Guía para ejecutar la aplicación y comprobar que cumple los requisitos, escenarios y
criterios de aceptación de la SPEC 001. La implementación detallada vive en
`tasks.md` y el código; aquí solo se documenta cómo correr y verificar.

## Prerrequisitos

- Node.js 20 LTS y npm.
- Sin variables de entorno, sin servicios externos, sin credenciales.

## Puesta en marcha

```bash
npm install
npm run dev          # servidor de desarrollo Vite; abre la URL que imprime (p. ej. http://localhost:5173)
```

Build y previsualización del artefacto estático:

```bash
npm run build        # genera dist/ (bundle estático)
npm run preview      # sirve dist/ con fallback SPA a index.html
```

> **Despliegue**: al usar rutas limpias (`BrowserRouter`), el hosting debe servir
> `index.html` para cualquier ruta profunda (`/topologia`, etc.). `npm run preview` ya
> lo hace. Si el hosting objetivo no lo permite, cambiar a `HashRouter` (sustitución
> directa, sin tocar vistas).

## Ejecutar las pruebas

```bash
npm run test         # Vitest + React Testing Library (unitarias / de componente)
npm run test:e2e     # Playwright (navegación real, recarga, alternancia rápida)
```

## Escenarios de validación end-to-end

Cada escenario es ejecutable manualmente en `npm run dev` y está cubierto por una
prueba automatizada.

### V1 — Reconocer qué es IDAF (US1)
1. Abrir la aplicación en `/`.
2. **Esperado**: se ve el nombre **IDAF**; un texto breve de propósito que menciona
   descubrimiento, gestión, diagnóstico y observabilidad de dispositivos de red e
   IoT; y la lista de las 7 áreas con su estado ("Disponible" para Inicio, "No
   disponible" para las otras seis).
3. Cubre: FR-001, FR-002, FR-003, FR-004, FR-005 · SC-001, SC-005 · CA-01, CA-02,
   CA-03. Prueba: `tests/unit/home-view.test.tsx`.

### V2 — Navegación entre todas las áreas (US2)
1. Con la navegación principal visible, seleccionar cada una de las 7 áreas y
   confirmar que se muestra su vista, identificada por su nombre.
2. Desde Topología, seleccionar Inventario → pasa a Inventario **sin** volver a
   Inicio.
3. Desde cualquier módulo, seleccionar Inicio → vuelve a Inicio **sin recarga**.
4. Cubre: FR-006, FR-008, FR-009, FR-010, FR-011, FR-012 · SC-002, SC-003 · CA-04,
   CA-05, CA-06. Pruebas: `tests/unit/primary-nav.test.tsx`,
   `tests/e2e/navigation.spec.ts`.

### V3 — Módulos no disponibles (US3)
1. Entrar a Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología y
   Observabilidad, uno por uno.
2. **Esperado** en cada uno: encabezado con el nombre del módulo + mensaje explícito
   de "funcionalidad pendiente / se incorporará más adelante"; **ningún** botón o
   acción ("Ejecutar diagnóstico", "Escanear red", etc.); vista no vacía y sin
   información técnica.
3. Confirmar que en **ninguna** de las siete áreas aparecen datos que parezcan
   dispositivos.
4. Cubre: FR-015, FR-016, FR-017, FR-018, FR-019 · SC-004 · CA-07, CA-08, CA-09.
   Prueba: `tests/unit/module-unavailable.test.tsx`.

### V4 — Reselección del área activa
1. Estando en un módulo, hacer clic en esa misma entrada de navegación 10 veces.
2. **Esperado**: sin errores; un solo encabezado de vista; sin contenido duplicado.
3. Cubre: FR-013 · SC-007 · EC-01 · CA-10. Prueba:
   `tests/e2e/repeat-and-rapid.spec.ts`.

### V5 — Alternancia rápida
1. Alternar entre varias áreas de forma rápida y repetida (≥ 20 veces).
2. **Esperado**: al parar, solo se ve la última área; la app sigue respondiendo; sin
   vistas acumuladas; sin errores en consola.
3. Cubre: FR-014 · SC-006 · EC-02 · CA-11. Prueba:
   `tests/e2e/repeat-and-rapid.spec.ts`.

### V6 — Destino desconocido
1. Navegar manualmente a `/ruta-inexistente`.
2. **Esperado**: la aplicación redirige a Inicio (`/`); la navegación principal sigue
   visible; nunca aparece un error crudo ni una traza. No hay pantalla de "no
   encontrado".
3. Cubre: FR-022 · EC-05 "ruta / destino desconocido" · CA-12. Prueba:
   `tests/e2e/unknown-route.spec.ts`.

### V7 — Recarga / acceso directo estando en un módulo
1. Ir a `/topologia` y recargar el navegador; luego abrir `/diagnosticos` directamente
   en una pestaña nueva.
2. **Esperado**: la app permanece en Topología (`/topologia`) tras la recarga, y
   muestra Diagnósticos al abrir su URL directamente; la navegación principal sigue
   visible y utilizable. Inicio solo aparece al abrir la raíz `/`.
3. Cubre: FR-027 · EC-06 "recarga estando en un módulo" · contrato C7. Prueba:
   `tests/e2e/reload.spec.ts`.

### V8 — Fallo al mostrar una sección
1. (Prueba automatizada) forzar que una vista lance un error al renderizar.
2. **Esperado**: mensaje comprensible + acciones **Reintentar** y **Volver a Inicio**;
   "Reintentar" vuelve a intentar la ruta actual y, si falla de nuevo, permanece el
   mensaje con la opción **Volver a Inicio**; **no** se muestra el texto técnico del
   error.
3. Cubre: FR-020, FR-021 · EC-03, EC-04 · SC-006. Prueba:
   `tests/unit/route-error.test.tsx`.

### V9 — Sesión larga sin errores
1. Recorrer las 7 áreas y alternar entre ellas al menos 20 veces.
2. **Esperado**: ningún error técnico visible, ninguna pantalla en blanco, ningún
   contenido duplicado; consola sin errores.
3. Cubre: SC-006. Prueba: `tests/e2e/repeat-and-rapid.spec.ts`.

### V10 — Accesibilidad de la navegación
1. Con el teclado (Tab / Shift+Tab) recorrer las siete entradas de la navegación
   principal y activar una con Enter.
2. **Esperado**: el foco llega a cada entrada en orden y es visible en todo momento;
   Enter navega al área; la entrada del área actual se anuncia como activa
   (`aria-current`); el nombre de cada entrada coincide con su etiqueta visible.
3. Cubre: FR-028, FR-029, FR-030, FR-031 · contrato C10 · CA-04. Prueba:
   `tests/e2e/a11y-nav.spec.ts`.

## Checklist manual de criterios de aceptación (SC-008)

Los criterios **CA-01 … CA-12 están definidos en `spec.md` → *Criterios de aceptación
(CA-01 … CA-12)*** (la especificación es autosuficiente). Esta tabla solo mapea cada
uno a su escenario de validación. Recorrer la app y responder "Sí" a los 12:

| # | Comprobación | Verificado en |
|---|--------------|---------------|
| CA-01 | Al abrir, aparece Inicio identificando el producto como IDAF. | V1 |
| CA-02 | Inicio explica el propósito (descubrimiento/gestión/diagnóstico/observabilidad, red e IoT). | V1 |
| CA-03 | Inicio lista las 7 áreas con su estado de disponibilidad. | V1 |
| CA-04 | La navegación principal con las 7 áreas está visible y usable desde cualquier área. | V2 |
| CA-05 | Se puede ir de un módulo a otro sin pasar por Inicio. | V2 |
| CA-06 | Se puede volver a Inicio desde cualquier módulo sin recargar. | V2 |
| CA-07 | Cada módulo pendiente tiene vista propia con su nombre. | V3 |
| CA-08 | Cada módulo pendiente dice explícitamente que no está disponible aún. | V3 |
| CA-09 | Ningún módulo pendiente muestra acciones falsas ni datos de dispositivos. | V3 |
| CA-10 | Reseleccionar el área activa no genera errores ni duplicados. | V4 |
| CA-11 | Alternar rápido deja solo la última área, sin estados pegados. | V5 |
| CA-12 | Un destino desconocido no produce error crudo; redirige a Inicio. | V6 |

## SC-005 — Comprensión del usuario (juicio humano, **no bloqueante**)

Pedir a una persona con perfil técnico de redes/soporte (sin experiencia previa con
IDAF) que use la app < 3 minutos y responda las cinco preguntas de `spec.md` → SC-005:
1. ¿Qué es IDAF? 2. ¿Para qué sirve? 3. ¿Cuáles serán sus capacidades principales?
4. ¿Cuáles están disponibles actualmente? 5. ¿Dónde puede encontrar cada una?
**Criterio**: responde las cinco correctamente. Un resultado deficiente se registra
como retroalimentación de redacción sobre `src/content/idaf.ts` y **no bloquea** por
sí solo la aceptación de la SPEC 001.
