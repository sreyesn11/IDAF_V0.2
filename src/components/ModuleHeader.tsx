import './ModuleHeader.css';

interface ModuleHeaderProps {
  title: string;
  description?: string;
}

/**
 * Encabezado de módulo consistente en las siete áreas (contract
 * visual-system §3.2; FR-031/032/033/036). El `<h1 tabIndex={-1}>` es el
 * destino de foco tras iniciar sesión (research D5; FR-054).
 */
export function ModuleHeader({ title, description }: ModuleHeaderProps) {
  return (
    <div className="module-header">
      <h1 tabIndex={-1}>{title}</h1>
      {description ? <p className="module-header__description">{description}</p> : null}
    </div>
  );
}
