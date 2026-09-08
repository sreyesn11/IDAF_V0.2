# Contrato interno — Navegación, rutas y estados de error

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md)

Define el comportamiento observable de la cáscara de navegación de IDAF. Es la
referencia contra la que se escriben las pruebas E2E.

## Mapa de rutas

| Ruta | Vista | Estado | Requisito |
|------|-------|--------|-----------|
| `/` | `HomeView` (funcional) | Disponible | FR-001, US1 |
| `/inventario` | `InventoryView` → `ModuleUnavailable("Inventario")` | No disponible | FR-015, FR-016 |
| `/descubrimiento` | `DiscoveryView` → `ModuleUnavailable("Descubrimiento")` | No disponible | FR-015, FR-016 |
| `/conexiones` | `ConnectionsView` → `ModuleUnavailable("Conexiones")` | No disponible | FR-015, FR-016 |
| `/diagnosticos` | `DiagnosticsView` → `ModuleUnavailable("Diagnósticos")` | No disponible | FR-015, FR-016 |
| `/topologia` | `TopologyView` → `ModuleUnavailable("Topología")` | No disponible | FR-015, FR-016 |
| `/observabilidad` | `ObservabilityView` → `ModuleUnavailable("Observabilidad")` | No disponible | FR-015, FR-016 |
| cualquier otra (`*`) | redirección `<Navigate to="/" replace />` (sin vista propia) | — | FR-022, EC-05 |

Todas las rutas se renderizan dentro de `AppLayout`, que mantiene la navegación
principal visible (FR-008). Una recarga del navegador o un acceso directo por URL a
cualquier ruta de la tabla (salvo `*`) resuelve a la misma vista (FR-027, C7).

## Contrato de comportamiento

### C1 — Navegación principal persistente
- **DADO** que el usuario está en cualquier ruta de la tabla (incluida `*`),
- **ENTONCES** la navegación principal muestra las 7 áreas, en orden, una vez cada
  una, y es utilizable. *(FR-006, FR-008, FR-009, SC-001)*
- El área correspondiente a la ruta actual se indica como activa, de forma visible y
  expuesta a tecnologías de asistencia. *(FR-012, FR-029)*

### C2 — Navegación directa entre áreas
- **DADO** que el usuario está en el área X,
- **CUANDO** selecciona el área Y (X ≠ Y) en la navegación,
- **ENTONCES** se muestra la vista de Y sin pasar por Inicio y **sin recarga del
  documento** (no se dispara un `load` de página). *(FR-010, FR-011, SC-002, US2-2)*

### C3 — Regreso a Inicio
- **DADO** que el usuario está en cualquier área,
- **CUANDO** selecciona "Inicio",
- **ENTONCES** se muestra `HomeView` en un paso, sin recarga ni reinicio. *(FR-011,
  SC-003, US2-3)*

### C4 — Reselección del área activa (idempotencia)
- **DADO** que el usuario está en el área X,
- **CUANDO** selecciona X de nuevo (incluso 10 veces seguidas),
- **ENTONCES** no se produce ningún error y la vista de X aparece una sola vez (un
  solo encabezado de módulo, sin contenido duplicado). *(FR-013, SC-007, EC-01)*

### C5 — Alternancia rápida
- **DADO** que el usuario alterna entre áreas muchas veces y rápido (≥ 20),
- **ENTONCES** al detenerse solo se ve la última área seleccionada, la aplicación
  sigue respondiendo, y no hay vistas acumuladas ni estado intermedio "pegado".
  *(FR-014, SC-006, EC-02)*

### C6 — Destino desconocido
- **DADO** que el usuario llega a una ruta que no está en la tabla (p. ej.
  `/no-existe`),
- **ENTONCES** la aplicación lo **redirige a Inicio** (`/`), con reemplazo del
  historial; queda en `HomeView` con la navegación principal visible. Nunca ve un
  error crudo ni una traza. No hay vista intermedia de "no encontrado".
  *(FR-022, EC-05 "ruta / destino desconocido")*

### C7 — Recarga o acceso directo a una ruta válida
- **DADO** que el usuario está en `/topologia` (u otra ruta válida de la tabla),
- **CUANDO** recarga el navegador **o** abre esa URL directamente,
- **ENTONCES** se muestra **esa misma área** (p. ej. `/topologia` → recarga →
  `/topologia`), con la navegación principal visible y utilizable; la navegación no
  queda rota. Inicio solo aparece como estado inicial al abrir la raíz `/`. Una ruta
  desconocida sigue C6 (redirección a Inicio). *(FR-027, EC-06 "recarga estando en un
  módulo")*
- Nota de despliegue: exige *fallback* del hosting a `index.html` para rutas
  profundas (ver quickstart), condición necesaria para cumplir FR-027 con
  `BrowserRouter`. `HashRouter` es alternativa directa (sin cambios de vistas) si el
  hosting no ofrece ese fallback; también satisface FR-027.

### C8 — Fallo al mostrar una sección
- **DADO** que una vista lanza un error al renderizarse,
- **ENTONCES** el usuario ve `RouteError`: mensaje comprensible + acciones
  **Reintentar** y **Volver a Inicio**. **No** se muestra el mensaje técnico del
  error ni una traza. *(FR-020, FR-021, EC-04 "fallo al mostrar una sección")*
- **Reintentar** vuelve a intentar la ruta actual; si vuelve a fallar, `RouteError`
  permanece visible con el mensaje y la acción **Volver a Inicio**, que está siempre
  disponible. *(FR-021, EC-04)*

### C9 — Sin errores técnicos en uso normal
- **DADO** un recorrido normal por las siete áreas con ≥ 20 alternancias,
- **ENTONCES** no aparece ningún error técnico, pantalla en blanco ni contenido
  duplicado; la consola del navegador no registra errores. *(FR-020, SC-006)*

### C10 — Accesibilidad de la navegación principal
- **DADO** que el usuario opera solo con el teclado,
- **ENTONCES** el foco alcanza cada una de las 7 entradas en orden y `Enter` navega
  al área correspondiente; el indicador de foco es visible en todo momento. *(FR-028,
  FR-031)*
- La entrada del área actual expone un estado activo perceptible (indicación visible
  y `aria-current="page"` o equivalente). *(FR-029)*
- El nombre accesible de cada entrada coincide con su etiqueta visible (de
  `content/idaf.ts`). *(FR-030)*

## Contrato de la vista de módulo no disponible

`ModuleUnavailable(areaLabel)` DEBE renderizar:
- un encabezado que contenga `areaLabel` (identifica la sección) — *FR-012*;
- un texto explícito de que la funcionalidad **todavía no está disponible** y **se
  incorporará en una versión posterior** de IDAF — *FR-016*;
- nada más accionable: sin `<button>`, sin `<input>`, sin `<a>` que aparente ejecutar
  una operación, sin elementos con `role="button"` — *FR-017*;
- contenido no vacío y sin información técnica interna — *FR-018*.

## Contrato de la pantalla de Inicio

`HomeView` DEBE contener:
- el nombre **IDAF** de forma visible — *FR-002*;
- una explicación breve del propósito que mencione descubrimiento, gestión,
  diagnóstico y observabilidad de dispositivos de red e IoT — *FR-003*;
- la lista de las 7 áreas, en orden, con su etiqueta (idéntica a la de la navegación)
  y su estado ("Disponible" para Inicio, "No disponible" para las otras seis) —
  *FR-004, FR-005, FR-025*;
- ningún dato que aparente representar dispositivos — *FR-019*.
