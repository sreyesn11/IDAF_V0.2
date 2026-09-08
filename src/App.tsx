import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { RootErrorBoundary } from './app/RootErrorBoundary';

/**
 * La aplicación abre directamente en Inicio (ruta `/`), sin ninguna pantalla de
 * inicio de sesión ni control de autenticación (FR-023).
 *
 * `RootErrorBoundary` es la red de seguridad para errores lanzados fuera del
 * árbol de rutas; los fallos de sección dentro de una ruta los captura el
 * `errorElement` del router (`RouteError`).
 */
export function App() {
  return (
    <RootErrorBoundary>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </RootErrorBoundary>
  );
}
