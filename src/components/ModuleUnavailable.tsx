import { ModuleHeader } from './ModuleHeader';
import { Icon, type IconName } from './icons';
import { StatusBadge } from './StatusBadge';
import { idaf } from '../content/idaf';
import './ModuleUnavailable.css';

interface ModuleUnavailableProps {
  /** Etiqueta visible del área, tomada del registro (vía `idaf.areaLabels`). */
  areaLabel: string;
  /** Icono del módulo, de la única familia de iconos (FR-019/020). */
  icon: IconName;
}

/**
 * Placeholder honesto de un área aún no implementada (contract
 * visual-system.md §3.6). Conserva la identidad de IDAF (tokens, iconos,
 * `ModuleHeader`) y NUNCA aparenta operar: sin `button`, `input`, `form`,
 * `select`, `role="button"`, enlaces de acción, tablas de datos ni valores
 * que parezcan métricas o dispositivos (FR-043, FR-044; SC-014).
 */
export function ModuleUnavailable({ areaLabel, icon }: ModuleUnavailableProps) {
  return (
    <section className="module-unavailable">
      <ModuleHeader title={areaLabel} />
      <Icon name={icon} title={areaLabel} className="module-unavailable__icon" />
      <StatusBadge kind="info">{idaf.statusText.unavailable}</StatusBadge>
      <p className="module-unavailable__body">{idaf.unavailableBody}</p>
    </section>
  );
}
