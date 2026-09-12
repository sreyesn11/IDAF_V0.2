import type { ReactNode } from 'react';
import './Surface.css';

interface SurfaceProps {
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor visual de «unidad independiente de información» (contract
 * visual-system §3.4). NO define contenido de datos: deja el lenguaje de
 * tarjeta listo para specs futuras sin mostrar métricas ficticias (FR-035).
 */
export function Surface({ children, className }: SurfaceProps) {
  return <div className={['surface', className].filter(Boolean).join(' ')}>{children}</div>;
}
