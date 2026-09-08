# Fase 1 — Modelo de datos

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Esta spec **no tiene persistencia ni datos de dominio** (dispositivos, inventario,
etc. están fuera de alcance — spec §Out of Scope). Las únicas "entidades" son
estructuras en memoria, definidas en código y fijas para esta versión. No hay base de
datos, esquema, ni migraciones.

---

## Entidad: Área funcional (módulo)

Unidad principal de navegación de IDAF. Conjunto **fijo de siete** en esta spec.

| Campo | Tipo | Reglas / validación | Origen en la spec |
|-------|------|---------------------|-------------------|
| `id` | `string` (slug estable) | Único en el registro. Valores: `home`, `inventory`, `discovery`, `connections`, `diagnostics`, `topology`, `observability`. No visible al usuario. | FR-006 |
| `path` | `string` (ruta URL) | Única. `home` → `/`; las demás → `/inventario`, `/descubrimiento`, `/conexiones`, `/diagnosticos`, `/topologia`, `/observabilidad`. La URL es la que permite que una recarga o un acceso directo conserven el área. | FR-009, FR-010, FR-027, EC-06 |
| `label` | `string` (texto visible) | Único. Importado de `content/idaf.ts`. Idéntico dondequiera que se muestre el área. Valores: "Inicio", "Inventario", "Descubrimiento", "Conexiones", "Diagnósticos", "Topología", "Observabilidad". | FR-007, FR-012, FR-025 |
| `order` | `number` (1–7) | Contiguo, sin repetición. Define el orden de FR-006: Inicio(1), Inventario(2), Descubrimiento(3), Conexiones(4), Diagnósticos(5), Topología(6), Observabilidad(7). | FR-006, SC-001 |
| `status` | `AvailabilityStatus` | Ver entidad siguiente. En esta spec: `available` solo para `home`; `unavailable` para las otras seis. | FR-005, FR-016, spec §Key Entities |
| `Component` | referencia a componente de vista | Para `home`: la vista funcional de Inicio. Para las demás: una vista que delega en `ModuleUnavailable` con `label`. | FR-012, FR-015, FR-016 |

### Invariantes del registro (verificadas por `tests/unit/registry.test.ts`)

1. Contiene **exactamente 7** áreas. *(FR-006, SC-001)*
2. Los `order` son exactamente `1..7` sin huecos ni repeticiones y en la secuencia
   definida por FR-006. *(FR-006, SC-001)*
3. `id`, `path` y `label` son **únicos** entre las siete entradas. *(FR-007)*
4. **Exactamente una** entrada tiene `status: 'available'` y es `home`. *(FR-005, spec
   §Key Entities: "solo Inicio es Disponible")*
5. Toda entrada con `status: 'unavailable'` usa un `Component` que renderiza
   `ModuleUnavailable` (sin acciones operativas). *(FR-016–FR-018)*
6. El array es la **única** fuente de la lista de áreas: navegación, Inicio y rutas se
   derivan de él. *(FR-025, SC-001)*

### Ciclo de vida / transiciones de estado

En esta spec el `status` es **constante**: no lo cambia el usuario ni ningún evento
(spec §Assumptions: "estado de disponibilidad fijo y definido en el producto").

Transición prevista para **specs futuras** (no se implementa aquí, se documenta para
dejar el punto de extensión explícito):

```
unavailable  ──(spec futura del módulo entrega la vista real)──▶  available
```

El cambio se hará editando **una** entrada del registro (`status` + `Component`); la
navegación, el router y la pantalla de Inicio no requieren modificación. Esto es lo
que materializa el requisito de "separación suficiente" del plan y el Principio V de
la Constitución.

---

## Entidad: Estado de disponibilidad (`AvailabilityStatus`)

Valor asociado a cada área que comunica si puede usarse.

| Valor | Significado | Presentación al usuario | Origen en la spec |
|-------|-------------|-------------------------|-------------------|
| `available` | El área tiene funcionalidad real y utilizable. | Texto "Disponible" en la lista de Inicio; entrada de navegación normal. | FR-005 |
| `unavailable` | El área existe y es navegable, pero su funcionalidad se incorporará después. | Texto **"No disponible"** en Inicio; al entrar, vista `ModuleUnavailable`. | FR-005, FR-016 |

- Conjunto cerrado de dos valores (unión discriminada en TypeScript). No se añaden
  otros estados en esta spec.
- El único texto de estado visible para las áreas pendientes es **"No disponible"**
  (no se usa "Próximamente"). Vive en `content/idaf.ts` y puede ajustarse sin cambiar
  la lógica (spec §Assumptions), siempre que siga comunicando lo mismo.

---

## Estructuras derivadas (no son entidades; se calculan del registro)

| Estructura | Derivación | Uso |
|------------|-----------|-----|
| Entradas de `PrimaryNav` | `registry` ordenado por `order` → `{ path, label, isActive }` | FR-006, FR-008, FR-009 |
| Filas de la lista de Inicio | `registry` ordenado por `order` → `{ label, statusText }` donde `statusText` es "Disponible" o "No disponible" | FR-004, FR-005 |
| Tabla de rutas del router | `registry` → `{ path, element: <Component/> }` + ruta `*` → `<Navigate to="/" replace />` | FR-010, FR-012, FR-022, FR-027 |

Ninguna de estas estructuras se almacena: se recalculan en render a partir del
registro, garantizando que no puedan divergir entre sí (FR-025).

No hay estructura para "destino desconocido": la ruta comodín solo emite una
redirección a `/` (ver [contracts/navigation-and-routes.md](./contracts/navigation-and-routes.md), C6).
