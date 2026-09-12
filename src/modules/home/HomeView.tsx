import { ModuleHeader } from '../../components/ModuleHeader';
import { Surface } from '../../components/Surface';
import { StatusBadge } from '../../components/StatusBadge';
import { idaf } from '../../content/idaf';
import './HomeView.css';

export interface HomeAreaRow {
  label: string;
  statusText: string;
  available: boolean;
}

interface HomeViewProps {
  /**
   * Filas de área a listar, en orden. Opcional con defecto `[]` para que
   * `HomeView` sea asignable a `React.ComponentType` en la entrada del
   * registro; el router siempre le pasa la lista real derivada de
   * `MODULE_REGISTRY`.
   */
  areas?: HomeAreaRow[];
}

/**
 * Pantalla de Inicio (contract visual-system.md §3.7; FR-059, SC-030).
 * Identidad de producto y `Brand` viven en el AppShell persistente; aquí se
 * muestran la explicación breve del propósito y una vista general
 * informativa de las siete áreas con su estado — sin datos operacionales ni
 * una segunda navegación (no sustituye a `PrimaryNav`).
 */
export function HomeView({ areas = [] }: HomeViewProps) {
  return (
    <section>
      <ModuleHeader title={idaf.areaLabels.home} description={idaf.purpose} />

      <ul className="home-view__areas">
        {areas.map((area) => (
          <li key={area.label}>
            <Surface className="home-view__area">
              <span className="home-view__area-label">{area.label}</span>
              <StatusBadge kind={area.available ? 'ok' : 'info'}>{area.statusText}</StatusBadge>
            </Surface>
          </li>
        ))}
      </ul>
    </section>
  );
}
