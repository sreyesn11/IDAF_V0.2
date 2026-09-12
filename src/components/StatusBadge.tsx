import type { ReactNode } from 'react';
import { Icon } from './icons';
import './StatusBadge.css';

export type StatusBadgeKind = 'ok' | 'warn' | 'error' | 'info';

interface StatusBadgeProps {
  kind: StatusBadgeKind;
  children: ReactNode;
}

/**
 * Estado semántico que SIEMPRE combina color + icono + texto — nunca sólo
 * color (contract visual-system §3.5; FR-039, SC-015).
 */
export function StatusBadge({ kind, children }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${kind}`}>
      <Icon name={`status-${kind}`} />
      <span>{children}</span>
    </span>
  );
}
