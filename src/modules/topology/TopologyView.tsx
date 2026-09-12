import { ModuleUnavailable } from '../../components/ModuleUnavailable';
import { idaf } from '../../content/idaf';

export function TopologyView() {
  return <ModuleUnavailable areaLabel={idaf.areaLabels.topology} icon="topology" />;
}
