import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { RouteError } from './RouteError';
import { HomeView } from '../modules/home/HomeView';
import { MODULE_REGISTRY, selectAreaList } from '../modules/registry';

/**
 * Rutas derivadas SOLO de `MODULE_REGISTRY` (research D4/D5; contract route
 * table). No hay lista de rutas escrita a mano en paralelo al registro.
 *
 *  - la entrada `home` (`path === '/'`) → ruta índice que compone
 *    `<HomeView areas={selectAreaList()} />` (aquí, en el router, se le entregan
 *    a Inicio sus datos derivados del registro);
 *  - cada entrada no-home → `{ path, element: <Component /> }`;
 *  - ruta comodín `*` → redirección a Inicio con reemplazo de historial
 *    (FR-022, EC-05).
 *
 * `createBrowserRouter` (URLs limpias) hace que una recarga o un acceso directo
 * a una ruta válida resuelva a su vista (FR-027), dado el fallback SPA a
 * `index.html` que sirve `npm run preview`.
 */
const areaRoutes: RouteObject[] = MODULE_REGISTRY.map((area) =>
  area.path === '/'
    ? {
        index: true,
        element: <HomeView areas={selectAreaList()} />,
        errorElement: <RouteError />,
      }
    : { path: area.path, element: <area.Component />, errorElement: <RouteError /> },
);

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <RouteError />,
      children: [...areaRoutes, { path: '*', element: <Navigate to="/" replace /> }],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
);
