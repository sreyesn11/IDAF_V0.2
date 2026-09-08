import { ModuleUnavailable } from '../../components/ModuleUnavailable';
import { idaf } from '../../content/idaf';

export function DiscoveryView() {
  return <ModuleUnavailable areaLabel={idaf.areaLabels.discovery} />;
}
