import { readFileSync } from 'node:fs';
import path from 'node:path';

const TOKENS_CSS = readFileSync(path.resolve(__dirname, '../../src/styles/tokens.css'), 'utf8');

function extractToken(name: string): string {
  const match = TOKENS_CSS.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Token --${name} no encontrado en tokens.css`);
  return match[1].trim();
}

function toNumeric(value: string): number {
  return parseFloat(value) * (value.trim().endsWith('rem') ? 16 : 1);
}

describe('tokens.css — roles de color (FR-037; contract visual-system.md §1.1)', () => {
  it('define los tokens de identidad', () => {
    for (const name of ['color-identity', 'color-identity-strong', 'color-identity-contrast']) {
      expect(extractToken(name)).toBeTruthy();
    }
  });

  it('define los tokens neutros (fondo, superficie, borde, texto)', () => {
    for (const name of [
      'color-bg',
      'color-surface',
      'color-surface-raised',
      'color-border',
      'color-text',
      'color-text-muted',
    ]) {
      expect(extractToken(name)).toBeTruthy();
    }
  });

  it('define las 4 familias semánticas completas (base/bg/text)', () => {
    for (const family of ['ok', 'warn', 'error', 'info']) {
      expect(extractToken(`color-${family}`)).toBeTruthy();
      expect(extractToken(`color-${family}-bg`)).toBeTruthy();
      expect(extractToken(`color-${family}-text`)).toBeTruthy();
    }
  });
});

describe('tokens.css — escala tipográfica y densidad (FR-040/042; SC-034/035)', () => {
  it('el <h1> de módulo (--font-size-600) es ≤ 2.0× el cuerpo (--font-size-300)', () => {
    const body = toNumeric(extractToken('font-size-300'));
    const h1 = toNumeric(extractToken('font-size-600'));
    expect(h1).toBeLessThanOrEqual(body * 2);
  });

  it('el line-height del cuerpo es ≥ 1.4 (SC-034)', () => {
    expect(parseFloat(extractToken('line-height-body'))).toBeGreaterThanOrEqual(1.4);
  });

  it('--motion-fast es ≤ 150ms, única duración de transición de estado (FR-030; SC-033)', () => {
    expect(parseFloat(extractToken('motion-fast'))).toBeLessThanOrEqual(150);
  });

  it('--layout-min-width es 1024px (research D14; FR-046)', () => {
    expect(extractToken('layout-min-width')).toBe('1024px');
  });

  it('--focus-ring-width es ≥ 3px (FR-040/041/054)', () => {
    expect(parseFloat(extractToken('focus-ring-width'))).toBeGreaterThanOrEqual(3);
  });
});
