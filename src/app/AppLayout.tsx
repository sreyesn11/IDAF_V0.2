import { Outlet } from 'react-router-dom';
import { PrimaryNav } from '../components/PrimaryNav';

/**
 * Marco persistente de la aplicación: la navegación principal permanece montada
 * y visible en todo cambio de ruta (FR-008, contract C1); la vista activa se
 * renderiza en `<main>` a través del `<Outlet/>`.
 */
export function AppLayout() {
  return (
    <>
      <PrimaryNav />
      <main>
        <Outlet />
      </main>
    </>
  );
}
