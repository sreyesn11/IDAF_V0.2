import { render, screen } from '@testing-library/react';

describe('test environment', () => {
  it('wires jsdom + React Testing Library + jest-dom together', () => {
    render(<span>ok</span>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
