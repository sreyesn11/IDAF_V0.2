import { ModuleUnavailable } from '../../components/ModuleUnavailable';
import { idaf } from '../../content/idaf';

export function ConnectionsView() {
  return <ModuleUnavailable areaLabel={idaf.areaLabels.connections} />;
}
