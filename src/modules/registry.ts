import { idaf } from '../content/idaf';
import type { FunctionalArea } from './types';
import type { HomeAreaRow } from './home/HomeView';
import { HomeView } from './home/HomeView';
import { InventoryView } from './inventory/InventoryView';
import { DiscoveryView } from './discovery/DiscoveryView';
import { ConnectionsView } from './connections/ConnectionsView';
import { DiagnosticsView } from './diagnostics/DiagnosticsView';
import { TopologyView } from './topology/TopologyView';
import { ObservabilityView } from './observability/ObservabilityView';

/**
 * ÚNICA fuente de la lista de áreas funcionales de IDAF (research D5; contract
 * `module-registry.md` R1–R7). La navegación principal, la lista de la pantalla
 * de Inicio y la tabla de rutas del router se derivan SOLO de este array; no
 * existe ninguna lista paralela.
 *
 * Grafo de importación: `registry.ts` importa `idaf.ts` y las siete vistas
 * (todas hojas); nada de lo que importa vuelve a importar `registry.ts`.
 *
 * Invariantes (verificadas en `tests/unit/registry.test.ts`):
 *  - exactamente 7 entradas;
 *  - `order` = 1..7 contiguo, en el orden de FR-006;
 *  - `id`, `path`, `label` únicos;
 *  - exactamente una entrada `available` y es `home`.
 */
export const MODULE_REGISTRY: readonly FunctionalArea[] = [
  {
    id: 'home',
    path: '/',
    label: idaf.areaLabels.home,
    order: 1,
    status: 'available',
    Component: HomeView,
  },
  {
    id: 'inventory',
    path: '/inventario',
    label: idaf.areaLabels.inventory,
    order: 2,
    status: 'unavailable',
    Component: InventoryView,
  },
  {
    id: 'discovery',
    path: '/descubrimiento',
    label: idaf.areaLabels.discovery,
    order: 3,
    status: 'unavailable',
    Component: DiscoveryView,
  },
  {
    id: 'connections',
    path: '/conexiones',
    label: idaf.areaLabels.connections,
    order: 4,
    status: 'unavailable',
    Component: ConnectionsView,
  },
  {
    id: 'diagnostics',
    path: '/diagnosticos',
    label: idaf.areaLabels.diagnostics,
    order: 5,
    status: 'unavailable',
    Component: DiagnosticsView,
  },
  {
    id: 'topology',
    path: '/topologia',
    label: idaf.areaLabels.topology,
    order: 6,
    status: 'unavailable',
    Component: TopologyView,
  },
  {
    id: 'observability',
    path: '/observabilidad',
    label: idaf.areaLabels.observability,
    order: 7,
    status: 'unavailable',
    Component: ObservabilityView,
  },
] as const;

/**
 * Selector puro: mapea el registro (ordenado por `order`) a las filas que la
 * pantalla de Inicio necesita — `{ label, statusText }` — con `statusText`
 * tomado de `idaf.statusText`. No almacena nada; se recalcula en cada uso para
 * que no pueda divergir de la navegación (FR-025).
 */
export function selectAreaList(
  registry: readonly FunctionalArea[] = MODULE_REGISTRY,
): HomeAreaRow[] {
  return [...registry]
    .sort((a, b) => a.order - b.order)
    .map((area) => ({
      label: area.label,
      statusText:
        area.status === 'available'
          ? idaf.statusText.available
          : idaf.statusText.unavailable,
    }));
}
