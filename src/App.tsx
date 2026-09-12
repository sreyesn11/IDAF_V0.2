import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { RootErrorBoundary } from './app/RootErrorBoundary';
import { SessionProvider } from './auth/SessionProvider';

/**
 * `SessionProvider` envuelve el router: `RequireSession` y `LoginView`
 * consumen `useSession()` en cualquier punto del árbol de rutas.
 *
 * `RootErrorBoundary` es la red de seguridad para errores lanzados fuera del
 * árbol de rutas; los fallos de sección dentro de una ruta los captura el
 * `errorElement` del router (`RouteError`).
 */
export function App() {
  return (
    <RootErrorBoundary>
      <SessionProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </SessionProvider>
    </RootErrorBoundary>
  );
}
