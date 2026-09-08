import { NavLink } from 'react-router-dom';
import { idaf } from '../content/idaf';
import { MODULE_REGISTRY } from '../modules/registry';
import './PrimaryNav.css';

/**
 * Navegación principal siempre visible (FR-008). Renderiza una entrada por área,
 * exactamente una vez, en el orden de FR-006, tomando las etiquetas SOLO de las
 * entradas del registro (una sola fuente — FR-025).
 *
 * Accesibilidad mínima (research D13, contract C10):
 *  - cada entrada es un `<a>` (`NavLink`), enfocable y activable por teclado (FR-028);
 *  - la entrada de la ruta actual expone `aria-current="page"` (lo pone `NavLink`)
 *    además del estilo visual `is-active` (FR-029);
 *  - el nombre accesible de cada entrada es su etiqueta visible (FR-030);
 *  - `:focus-visible` define un contorno visible (FR-031, ver `PrimaryNav.css`).
 */
export function PrimaryNav() {
  const areas = [...MODULE_REGISTRY].sort((a, b) => a.order - b.order);

  return (
    <nav aria-label={idaf.navAriaLabel} className="primary-nav">
      {areas.map((area) => (
        <NavLink
          key={area.id}
          to={area.path}
          end={area.path === '/'}
          // tabIndex explícito: garantiza que el foco de teclado alcance cada
          // entrada también en WebKit/Safari sin "Full Keyboard Access" (FR-028).
          tabIndex={0}
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
        >
          {area.label}
        </NavLink>
      ))}
    </nav>
  );
}
