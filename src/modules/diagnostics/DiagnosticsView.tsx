import { ModuleUnavailable } from '../../components/ModuleUnavailable';
import { idaf } from '../../content/idaf';

export function DiagnosticsView() {
  return <ModuleUnavailable areaLabel={idaf.areaLabels.diagnostics} icon="diagnostics" />;
}
