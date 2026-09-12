/**
 * Datos de trazado de la familia iconográfica de IDAF (contract visual-system
 * §2 I1): una única rejilla 24×24, un único grosor de trazo (aplicado por
 * `<Icon>`, no aquí). Cada icono es un array de subtrazados `d` de `<path>`.
 */
export type IconName =
  | 'home'
  | 'inventory'
  | 'discovery'
  | 'connections'
  | 'diagnostics'
  | 'topology'
  | 'observability'
  | 'brand'
  | 'user'
  | 'logout'
  | 'status-ok'
  | 'status-warn'
  | 'status-error'
  | 'status-info'
  | 'password-show'
  | 'password-hide';

/** Círculo dibujado como dos arcos, para mantener todo el set en `<path>`. */
function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

export const ICON_PATHS: Record<IconName, string[]> = {
  // Navegación (FR-019; data-model.md §5 — concepto, no implementación).
  home: ['M3 11 12 4l9 7', 'M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9', 'M10 20v-5h4v5'],
  inventory: ['M12 3 3 7l9 4 9-4-9-4z', 'M3 12l9 4 9-4', 'M3 17l9 4 9-4'],
  discovery: [circle(10, 10, 6), 'M14.5 14.5 20 20'],
  connections: [circle(7, 7, 3), circle(17, 17, 3), 'M9.5 9.5 14.5 14.5'],
  diagnostics: ['M3 12h4l2-7 4 14 2-7h6'],
  topology: [
    circle(6, 18, 2),
    circle(18, 18, 2),
    circle(12, 6, 2),
    'M7.5 16.5 10.8 7.5',
    'M16.5 16.5 13.2 7.5',
    'M8 18h8',
  ],
  observability: ['M4 20V12', 'M9 20V6', 'M14 20v-9', 'M19 20v-5'],

  // Símbolo de marca (FR-028) — nodos conectados, original de esta feature.
  brand: [
    circle(12, 12, 2.5),
    circle(5, 6, 1.8),
    circle(19, 6, 1.8),
    circle(5, 18, 1.8),
    circle(19, 18, 1.8),
    'M9.8 10.3 6.6 7.3',
    'M14.2 10.3 17.4 7.3',
    'M9.8 13.7 6.6 16.7',
    'M14.2 13.7 17.4 16.7',
  ],

  // Contexto de sesión.
  user: [circle(12, 8, 3.2), 'M5 20a7 7 0 0 1 14 0'],
  logout: ['M13 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7', 'M11 12h9', 'M17 8l4 4-4 4'],

  // Estados semánticos (FR-037; StatusBadge).
  'status-ok': [circle(12, 12, 8), 'M8.5 12.5 11 15l4.5-6'],
  'status-warn': ['M12 4 21 19H3z', 'M12 10v4', 'M12 16.5v.01'],
  'status-error': [circle(12, 12, 8), 'M9.5 9.5 14.5 14.5', 'M14.5 9.5 9.5 14.5'],
  'status-info': [circle(12, 12, 8), 'M12 11v5', 'M12 8v.01'],

  // Login.
  'password-show': ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z', circle(12, 12, 2.5)],
  'password-hide': ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z', circle(12, 12, 2.5), 'M4 4l16 16'],
};
