/** Las siete áreas en el orden de FR-006: etiqueta visible, ruta y encabezado <h1>. */
export interface AreaFixture {
  label: string;
  path: string;
  heading: string;
}

export const AREAS: AreaFixture[] = [
  { label: 'Inicio', path: '/', heading: 'IDAF' },
  { label: 'Inventario', path: '/inventario', heading: 'Inventario' },
  { label: 'Descubrimiento', path: '/descubrimiento', heading: 'Descubrimiento' },
  { label: 'Conexiones', path: '/conexiones', heading: 'Conexiones' },
  { label: 'Diagnósticos', path: '/diagnosticos', heading: 'Diagnósticos' },
  { label: 'Topología', path: '/topologia', heading: 'Topología' },
  { label: 'Observabilidad', path: '/observabilidad', heading: 'Observabilidad' },
];
