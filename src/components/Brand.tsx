import { Icon } from './icons';
import { idaf } from '../content/idaf';
import './Brand.css';

/**
 * Símbolo de marca + nombre «IDAF» (contract visual-system §3.1). Se usa
 * IDÉNTICO en `LoginView` y en el `<header>` del AppShell, para que Login y
 * la aplicación se reconozcan como el mismo producto (FR-028, FR-029).
 */
export function Brand() {
  return (
    <span className="brand">
      <Icon name="brand" className="brand-icon" />
      <span className="brand-name">{idaf.productName}</span>
    </span>
  );
}
