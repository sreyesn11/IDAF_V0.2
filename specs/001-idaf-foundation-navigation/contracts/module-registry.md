# Contrato interno — Registro de módulos (`module registry`)

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md) ·
**Modelo**: [../data-model.md](../data-model.md)

Este es el **punto de extensión** central de IDAF (Constitución, Principio V). No es
una API externa: es el contrato que todo código de un área —las seis pendientes hoy y
las funcionalidades futuras de Inventario, Descubrimiento, Conexiones, Diagnósticos,
Topología y Observabilidad— debe cumplir para integrarse **sin modificar la
navegación ni la estructura base**.

## Forma del contrato

```ts
// src/modules/types.ts
export type AvailabilityStatus = 'available' | 'unavailable';

export interface FunctionalArea {
  /** Slug estable, único, no visible. Nunca cambia entre versiones. */
  id: 'home' | 'inventory' | 'discovery' | 'connections'
    | 'diagnostics' | 'topology' | 'observability';
  /** Ruta URL única. `/` para home. */
  path: string;
  /** Texto visible único. Se importa de content/idaf.ts (fuente única). */
  label: string;
  /** 1..7, contiguo, en el orden de FR-006. */
  order: number;
  /** Fijo en esta spec. */
  status: AvailabilityStatus;
  /** Vista de React sin props obligatorias. */
  Component: React.ComponentType;
}

// src/modules/registry.ts
export const MODULE_REGISTRY: readonly FunctionalArea[] = [ /* 7 entradas */ ];
```

## Reglas que el registro DEBE cumplir (invariantes verificables)

| # | Regla | Requisito |
|---|-------|-----------|
| R1 | Exactamente 7 entradas. | FR-006, SC-001 |
| R2 | `order` = 1..7 sin huecos ni repetición, en la secuencia Inicio, Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología, Observabilidad. | FR-006 |
| R3 | `id`, `path` y `label` únicos entre entradas. | FR-007 |
| R4 | `label` proviene de `content/idaf.ts`; ningún otro archivo define texto de área. | FR-025, Principio XI |
| R5 | Exactamente una entrada con `status: 'available'`: `home`. Las otras seis son `unavailable` y su único texto de estado visible es "No disponible" (no "Próximamente"). | FR-005, Key Entities |
| R6 | Toda entrada `unavailable` tiene un `Component` que renderiza `<ModuleUnavailable areaLabel={label} />` y **ningún** control accionable. | FR-016, FR-017, FR-018 |
| R7 | `PrimaryNav`, la lista de Inicio y la tabla de rutas se construyen **solo** a partir de `MODULE_REGISTRY` (ninguna lista paralela). | FR-004, FR-006, FR-025, SC-001 |

## Cómo una spec futura añade funcionalidad real (no aplicar en SPEC 001)

1. Implementar la vista real dentro de `src/modules/<area>/`.
2. En `MODULE_REGISTRY`, cambiar en **esa única entrada**: `status` de
   `'unavailable'` a `'available'` y `Component` → la nueva vista.
3. No se edita `PrimaryNav`, `router.tsx`, `AppLayout` ni `HomeView`.
4. Las invariantes R1–R3 siguen intactas; R5 pasa a permitir más de un `available`.

Este procedimiento es la prueba de que la estructura base **no se rehace** al crecer
IDAF (requisito explícito del plan; Principios V y XII de la Constitución).

## Fuera de este contrato (SPEC 001)

- Metadatos de dominio de cada área (tipos de dispositivo, capacidades de collector,
  permisos): pertenecen a specs futuras.
- Carga diferida / `code-splitting` por módulo: aplazado (research D7); si se añade,
  `Component` pasaría a `React.LazyExoticComponent` sin cambiar R1–R7.
