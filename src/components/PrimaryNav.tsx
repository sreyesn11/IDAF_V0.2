import { NavLink } from 'react-router-dom';
import { Icon } from './icons';
import { idaf } from '../content/idaf';
import { MODULE_REGISTRY } from '../modules/registry';
import './PrimaryNav.css';

/**
 * Navegación principal (contract navigation-and-routes §3). Una entrada por
 * área de `MODULE_REGISTRY`, en orden `order`, con icono + nombre visible
 * (N2; FR-018/024). El estado activo se resuelve con clases (`.is-active`)
 * que en CSS aplican ≥ 2 propiedades no cromáticas simultáneas (N4; FR-021,
 * SC-031); `NavLink` añade `aria-current="page"` automáticamente.
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
          tabIndex={0}
          className={({ isActive }) => `primary-nav__link${isActive ? ' is-active' : ''}`}
        >
          <Icon name={area.icon} />
          <span className="primary-nav__label">{area.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
