import { ModuleUnavailable } from '../../components/ModuleUnavailable';
import { idaf } from '../../content/idaf';

export function InventoryView() {
  return <ModuleUnavailable areaLabel={idaf.areaLabels.inventory} icon="inventory" />;
}
