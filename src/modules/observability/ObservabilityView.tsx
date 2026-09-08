import { ModuleUnavailable } from '../../components/ModuleUnavailable';
import { idaf } from '../../content/idaf';

export function ObservabilityView() {
  return <ModuleUnavailable areaLabel={idaf.areaLabels.observability} />;
}
