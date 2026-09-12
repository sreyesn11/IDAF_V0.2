import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useRouteError } from 'react-router-dom';
import { idaf } from '../content/idaf';
import './RouteError.css';

/**
 * `errorElement` del router (research D9; contract C8). Se muestra cuando una
 * vista falla al renderizarse.
 *
 *  - muestra un mensaje comprensible (`idaf.sectionErrorText`), sin códigos ni
 *    jerga técnica (FR-021);
 *  - ofrece dos salidas: **Reintentar** (vuelve a intentar la ruta actual) y
 *    **Volver a Inicio** (siempre presente) (FR-021);
 *  - si la ruta vuelve a fallar tras "Reintentar", este mismo componente sigue
 *    visible con el mensaje y "Volver a Inicio";
 *  - el detalle del error va a `console.error`, nunca al DOM (FR-018, FR-020).
 */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Detalle técnico solo en consola de desarrollo, nunca en la interfaz.
    console.error('IDAF: no se pudo mostrar la sección', location.pathname, error);
  }, [error, location.pathname]);

  return (
    <section className="route-error" aria-labelledby="route-error-heading">
      <h1 id="route-error-heading">{idaf.sectionErrorText}</h1>
      <p className="route-error__actions">
        <button
          type="button"
          className="route-error__retry"
          onClick={() => navigate(location.pathname, { replace: true })}
        >
          {idaf.errorActions.retry}
        </button>
        <Link to="/" className="route-error__back">
          {idaf.errorActions.backHome}
        </Link>
      </p>
    </section>
  );
}
