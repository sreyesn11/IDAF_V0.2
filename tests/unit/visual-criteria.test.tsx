import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginView } from '../../src/modules/login/LoginView';
import { HomeView } from '../../src/modules/home/HomeView';
import { useSession } from '../../src/auth/useSession';
import { selectAreaList } from '../../src/modules/registry';

vi.mock('../../src/auth/useSession');
const mockedUseSession = vi.mocked(useSession);

const STYLE_ROOT = path.resolve(__dirname, '../../src');
const CSS_FILES_UNDER_TEST = [
  'styles/tokens.css',
  'styles/base.css',
  'components/Brand.css',
  'components/ModuleHeader.css',
  'components/Surface.css',
  'components/StatusBadge.css',
  'modules/login/LoginView.css',
  'modules/home/HomeView.css',
];

function readCss(): string {
  return CSS_FILES_UNDER_TEST.map((relative) => readFileSync(path.join(STYLE_ROOT, relative), 'utf8')).join('\n');
}

function assertNoDecorativeGraphics(container: HTMLElement): void {
  expect(container.querySelectorAll('img').length).toBe(0);
  expect(container.querySelectorAll('canvas').length).toBe(0);
  for (const el of Array.from(container.querySelectorAll<HTMLElement>('*'))) {
    expect(el.style.backgroundImage).toBe('');
  }
  // Todo <svg> es funcional (marca, iconos de nav/UI/estado): o bien
  // `aria-hidden` (acompaña texto visible) o `role="img"` con `<title>`.
  for (const svg of Array.from(container.querySelectorAll('svg'))) {
    const isDecorativeIcon = svg.getAttribute('aria-hidden') === 'true';
    const isNamedImage = svg.getAttribute('role') === 'img' && svg.querySelector('title') !== null;
    expect(isDecorativeIcon || isNamedImage).toBe(true);
  }
}

describe('Login + Inicio — sin gráficos decorativos (SC-032; FR-030) — sólo lo disponible en US2', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({ state: { status: 'anonymous' }, login: vi.fn(), logout: vi.fn() });
  });

  it('Login: sin <img>/<canvas>/background-image; todo <svg> es funcional', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>,
    );
    assertNoDecorativeGraphics(container);
  });

  it('Inicio: sin <img>/<canvas>/background-image; todo <svg> es funcional', () => {
    const { container } = render(<HomeView areas={selectAreaList()} />);
    assertNoDecorativeGraphics(container);
  });
});

describe('Login + Inicio — transiciones/animaciones ≤150ms, sin bucles (SC-033; FR-030)', () => {
  const css = readCss();

  it('toda declaración transition usa --motion-fast o una duración literal ≤150ms', () => {
    const declarations = css.match(/\btransition(?:-duration)?\s*:\s*[^;]+;/g) ?? [];
    expect(declarations.length).toBeGreaterThan(0);
    for (const declaration of declarations) {
      if (declaration.includes('var(--motion-fast)')) continue;
      const msMatch = declaration.match(/(\d+(?:\.\d+)?)(ms|s)/);
      expect(msMatch, `duración no reconocible en: ${declaration}`).not.toBeNull();
      if (msMatch) {
        const value = parseFloat(msMatch[1]) * (msMatch[2] === 's' ? 1000 : 1);
        expect(value).toBeLessThanOrEqual(150);
      }
    }
  });

  it('ninguna animación usa iteration-count infinito', () => {
    expect(css).not.toMatch(/animation-iteration-count\s*:\s*infinite/);
    expect(css).not.toMatch(/animation\s*:[^;]*\binfinite\b/);
  });
});

describe('Login + Inicio — line-height de contenido ≥ 1.4 (SC-034; FR-030/042)', () => {
  it('base.css fija el line-height de body en --line-height-body (≥1.4, verificado en tokens.test.ts)', () => {
    const css = readCss();
    expect(css).toMatch(/body\s*\{[^}]*line-height:\s*var\(--line-height-body\)/);
  });
});

describe('Login — hit-target ≥ 24×24 (SC-035) — proxy por fuente (geometría real en Playwright)', () => {
  it('LoginView.css declara min-height ≥ 24px para sus controles interactivos', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>,
    );
    mockedUseSession.mockReturnValue({ state: { status: 'anonymous' }, login: vi.fn(), logout: vi.fn() });
    const css = readFileSync(path.join(STYLE_ROOT, 'modules/login/LoginView.css'), 'utf8');
    const minHeights = css.match(/min-height:\s*\d+px/g) ?? [];
    expect(minHeights.length).toBeGreaterThan(0);
    for (const declaration of minHeights) {
      const value = parseInt(declaration.replace(/\D/g, ''), 10);
      expect(value).toBeGreaterThanOrEqual(24);
    }
    expect(container.querySelectorAll('input, button').length).toBeGreaterThan(0);
  });
});
