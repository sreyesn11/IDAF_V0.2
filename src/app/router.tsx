import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { RequireSession } from './RequireSession';
import { RouteError } from './RouteError';
import { LoginView } from '../modules/login/LoginView';
import { HomeView } from '../modules/home/HomeView';
import { MODULE_REGISTRY, selectAreaList } from '../modules/registry';

/**
 * Zona pública (`/login`, sin `AppLayout`) + zona protegida tras
 * `RequireSession` (contract navigation-and-routes.md §1–2). Las rutas de
 * área siguen derivándose SOLO de `MODULE_REGISTRY`; el comodín protegido
 * redirige a Inicio sin error (FR-053).
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
      path: '/login',
      element: <LoginView />,
      errorElement: <RouteError />,
    },
    {
      path: '/',
      element: <RequireSession />,
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
