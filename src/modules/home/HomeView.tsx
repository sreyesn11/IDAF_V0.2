import { idaf } from '../../content/idaf';

export interface HomeAreaRow {
  label: string;
  statusText: string;
}

interface HomeViewProps {
  /**
   * Filas de área a listar (etiqueta + texto de estado), en orden. Opcional con
   * defecto `[]` para que `HomeView` sea asignable a `React.ComponentType` en la
   * entrada del registro; el router siempre le pasa la lista real derivada de
   * `MODULE_REGISTRY`.
   */
  areas?: HomeAreaRow[];
}

/**
 * Pantalla de Inicio: único módulo funcional (US1).
 *
 * Componente presentacional y dirigido por props. Muestra el nombre de producto
 * (FR-002), una explicación breve del propósito (FR-003) y una lista informativa
 * de las áreas con su estado (FR-004, FR-005). No renderiza ninguna tabla, fila
 * o valor que pueda parecer un dispositivo real o simulado (FR-019).
 *
 * Importa SOLO `src/content/idaf.ts`; nunca `src/modules/registry.ts`
 * (grafo de importación acíclico — ver tasks.md, Phase 3).
 */
export function HomeView({ areas = [] }: HomeViewProps) {
  return (
    <section aria-labelledby="home-heading">
      <h1 id="home-heading">{idaf.productName}</h1>
      <p>{idaf.purpose}</p>

      <h2>Áreas</h2>
      <ul>
        {areas.map((area) => (
          <li key={area.label}>
            <span>{area.label}</span>
            {' — '}
            <span>{area.statusText}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
