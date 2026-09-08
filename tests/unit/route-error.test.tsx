import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { RouteError } from '../../src/app/RouteError';
import { idaf } from '../../src/content/idaf';

const TECHNICAL_DETAIL = 'BoomInternalStackDetail_4f2a';

function Explode(): never {
  throw new Error(TECHNICAL_DETAIL);
}

function renderFailingRoute() {
  const router = createMemoryRouter(
    [{ path: '/', element: <Explode />, errorElement: <RouteError /> }],
    { future: { v7_relativeSplatPath: true } },
  );
  return render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
}

describe('RouteError (FR-020, FR-021, EC-04, C8)', () => {
  it('shows the friendly message + both recovery actions, hides the technical detail, logs to console.error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderFailingRoute();

    expect(screen.getByText(idaf.sectionErrorText)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: idaf.errorActions.retry })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: idaf.errorActions.backHome })).toBeInTheDocument();

    expect(screen.queryByText(TECHNICAL_DETAIL)).toBeNull();
    expect(document.body.textContent).not.toContain(TECHNICAL_DETAIL);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('after "Reintentar" on a route that still throws, the friendly message and "Volver a Inicio" remain', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderFailingRoute();

    await user.click(screen.getByRole('button', { name: idaf.errorActions.retry }));

    expect(screen.getByText(idaf.sectionErrorText)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: idaf.errorActions.backHome })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(TECHNICAL_DETAIL);

    consoleError.mockRestore();
  });
});
