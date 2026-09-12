import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, type StatusBadgeKind } from '../../src/components/StatusBadge';

const KINDS: StatusBadgeKind[] = ['ok', 'warn', 'error', 'info'];

describe('StatusBadge (contract visual-system.md §3.5; FR-039)', () => {
  it.each(KINDS)('kind="%s" combina icono + texto, nunca sólo color', (kind) => {
    render(<StatusBadge kind={kind}>Etiqueta</StatusBadge>);
    const badge = screen.getByText('Etiqueta').closest(`.status-badge--${kind}`);
    expect(badge).not.toBeNull();
    expect(badge?.querySelector('svg')).not.toBeNull();
  });

  it('cada familia semántica usa una clase distinta (4 familias — FR-037)', () => {
    const classes = KINDS.map((kind) => {
      const { container, unmount } = render(<StatusBadge kind={kind}>x</StatusBadge>);
      const cls = container.querySelector('.status-badge')?.className ?? '';
      unmount();
      return cls;
    });
    expect(new Set(classes).size).toBe(4);
  });
});

describe('Estado "deshabilitado": opacidad + cursor:not-allowed + aria-disabled (FR-041)', () => {
  it('LoginView.css define el estado :disabled con opacidad reducida y cursor not-allowed', () => {
    const css = readFileSync(
      path.resolve(__dirname, '../../src/modules/login/LoginView.css'),
      'utf8',
    );
    const disabledRule = css.match(/\.login-view__submit:disabled\s*\{([^}]+)\}/)?.[1] ?? '';
    expect(disabledRule).toMatch(/opacity/);
    expect(disabledRule).toMatch(/cursor:\s*not-allowed/);
  });
});
