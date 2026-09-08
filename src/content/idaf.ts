import type { FunctionalAreaId } from '../modules/types';

/**
 * Fuente ÚNICA de todo el texto visible de IDAF (research D10, Constitución XI).
 *
 * Ningún otro módulo define literales de texto de área, estado o mensajes: los
 * obtiene solo desde aquí. El texto exacto puede ajustarse siempre que conserve
 * lo verificable por FR-002 (nombre "IDAF"), FR-003 (los cuatro conceptos y
 * "red e IoT") y FR-016 ("no disponible" + incorporación futura).
 */
export const idaf = {
  /** FR-002 — nombre de producto visible. */
  productName: 'IDAF',

  /**
   * FR-003 — explicación breve del propósito. Menciona, de forma obligatoria,
   * descubrimiento, gestión, diagnóstico y observabilidad de dispositivos de
   * red e IoT.
   */
  purpose:
    'IDAF es una plataforma para el descubrimiento, la gestión, el diagnóstico y ' +
    'la observabilidad de dispositivos de red e IoT. En esta versión inicial solo ' +
    'el área de Inicio está disponible; las demás áreas se incorporarán en ' +
    'versiones posteriores.',

  /**
   * FR-006 / FR-007 / FR-025 — etiqueta visible única por área, idéntica en la
   * pantalla de Inicio y en la navegación principal.
   */
  areaLabels: {
    home: 'Inicio',
    inventory: 'Inventario',
    discovery: 'Descubrimiento',
    connections: 'Conexiones',
    diagnostics: 'Diagnósticos',
    topology: 'Topología',
    observability: 'Observabilidad',
  } satisfies Record<FunctionalAreaId, string>,

  /**
   * FR-005 / Key Entities — las DOS únicas etiquetas de estado oficiales.
   * "Próximamente" no es válida.
   */
  statusText: {
    available: 'Disponible',
    unavailable: 'No disponible',
  },

  /**
   * FR-016 — texto de la vista de un módulo aún no disponible: indica de forma
   * explícita que la funcionalidad todavía no está disponible y que se
   * incorporará en una versión posterior de IDAF.
   */
  unavailableBody:
    'Esta funcionalidad todavía no está disponible y se incorporará en una ' +
    'versión posterior de IDAF.',

  /** FR-021 — mensaje comprensible cuando una sección no puede mostrarse. */
  sectionErrorText:
    'No se pudo mostrar esta sección. Puedes reintentar o volver a Inicio.',

  /** FR-021 — acciones de salida ofrecidas por la vista de error de sección. */
  errorActions: {
    retry: 'Reintentar',
    backHome: 'Volver a Inicio',
  },

  /** FR-030 — nombre accesible de la navegación principal. */
  navAriaLabel: 'Áreas de IDAF',
} as const;

export type IdafContent = typeof idaf;
