import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// jsdom no implementa matchMedia; algún componente puede consultarlo.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/**
 * jsdom expone `document.visibilityState` como una propiedad de sólo lectura
 * fija en `'visible'`. Los tests de revalidación multi-pestaña (FR-058) usan
 * esta utilidad para simular que la pestaña pasa a visible/oculta y disparar
 * el evento `visibilitychange` que escucha `SessionProvider`.
 */
export function setDocumentVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

afterEach(() => {
  window.sessionStorage.clear();
});
