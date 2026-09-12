import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { PrimaryNav } from '../components/PrimaryNav';
import { SessionBar } from '../components/SessionBar';
import './AppLayout.css';

/**
 * AppShell (contract navigation-and-routes.md §4): cuatro zonas estables
 * como landmarks — `<header>` (banner: `Brand` + `SessionBar`), navegación
 * global (`PrimaryNav`, su propio landmark `navigation`), `<main>` (la mayor
 * superficie: `ModuleHeader` de cada vista + `<Outlet/>`). Persiste montado
 * en toda ruta protegida (FR-031, FR-034; SC-017, SC-018).
 */
export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Foco al <h1> del módulo activo cuando el shell se monta por primera vez
    // (tras iniciar sesión o al rehidratar con sesión ya activa) — research
    // D5; FR-054.
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus();
  }, []);

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Brand />
        <SessionBar />
      </header>
      <div className="app-shell__nav-zone">
        <PrimaryNav />
      </div>
      <main className="app-shell__main" ref={mainRef}>
        <Outlet />
      </main>
    </div>
  );
}
