import type { ComponentType } from 'react';
import type { IconName } from '../components/icons';

/**
 * Estado de disponibilidad de un área funcional.
 * Conjunto cerrado de dos valores (spec §Key Entities). No se añaden otros.
 */
export type AvailabilityStatus = 'available' | 'unavailable';

/**
 * Slug estable, único y no visible de cada una de las siete áreas funcionales.
 * Nunca cambia entre versiones (contract R1, data-model.md).
 */
export type FunctionalAreaId =
  | 'home'
  | 'inventory'
  | 'discovery'
  | 'connections'
  | 'diagnostics'
  | 'topology'
  | 'observability';

/**
 * Contrato que toda área (las seis pendientes hoy y las funcionalidades futuras)
 * debe cumplir para integrarse sin modificar la navegación ni la estructura base.
 * Ver `specs/001-idaf-foundation-navigation/contracts/module-registry.md`.
 */
export interface FunctionalArea {
  /** Slug estable, único, no visible. */
  id: FunctionalAreaId;
  /** Ruta URL única. `/` para home. */
  path: string;
  /** Texto visible único. Se importa de `content/idaf.ts` (fuente única). */
  label: string;
  /** 1..7, contiguo, en el orden de FR-006. */
  order: number;
  /** Fijo en esta spec. */
  status: AvailabilityStatus;
  /** Icono de la familia única que representa el concepto del área (FR-019/020). */
  icon: IconName;
  /** Descripción breve para `ModuleHeader`, cuando aporta claridad (FR-033). */
  description?: string;
  /** Vista de React sin props obligatorias. */
  Component: ComponentType;
}
