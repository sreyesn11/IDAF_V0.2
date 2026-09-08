import { idaf } from '../content/idaf';

interface ModuleUnavailableProps {
  /** Etiqueta visible del área, tomada del registro (que la toma de `idaf.areaLabels`). */
  areaLabel: string;
}

/**
 * Placeholder honesto de un área aún no implementada (research D6; contract
 * "Contrato de la vista de módulo no disponible").
 *
 * Solo texto: un encabezado con el nombre del área y un párrafo que indica de
 * forma explícita que la funcionalidad todavía no está disponible y se
 * incorporará en una versión posterior de IDAF. Sin `button`, `input`, `form`,
 * `select`, enlaces de acción ni `role="button"`; sin estado vacío, sin estilo
 * de error, sin información técnica interna (FR-016, FR-017, FR-018).
 */
export function ModuleUnavailable({ areaLabel }: ModuleUnavailableProps) {
  return (
    <section aria-labelledby="module-unavailable-heading">
      <h1 id="module-unavailable-heading">{areaLabel}</h1>
      <p>{idaf.unavailableBody}</p>
    </section>
  );
}
