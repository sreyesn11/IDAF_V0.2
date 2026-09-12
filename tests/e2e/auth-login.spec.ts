import { test, expect } from '@playwright/test';
import { loadE2eAccounts, primaryAccount, secondaryAccount } from './_session';

test.describe('Acceso mediante inicio de sesión (US1; SC-001/002/003/027/028)', () => {
  test('sin sesión, "/" muestra Login y ninguna entrada de navegación de área está en el DOM (SC-001)', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(screenBrand(page)).toBeVisible();
    expect(await page.getByRole('navigation').count()).toBe(0);
  });

  test('abrir directamente una ruta protegida sin sesión también muestra Login', async ({ page }) => {
    await page.goto('/topologia');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('credenciales válidas llevan a Inicio con la navegación de 7 áreas; SC-002 medido con el reloj del test runner', async ({
    page,
  }) => {
    const account = primaryAccount();
    await page.goto('/login');
    await page.getByLabel('Usuario', { exact: true }).fill(account.username);
    await page.getByLabel('Contraseña', { exact: true }).fill(account.password);

    const t0 = Date.now();
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeFocused();
    await expect(page.getByRole('navigation', { name: 'Áreas de IDAF' })).toBeVisible();
    const t1 = Date.now();

    expect(t1 - t0).toBeLessThan(30000);
  });

  test('una segunda cuenta predefinida obtiene el mismo AppShell y las mismas 7 áreas (FR-016)', async ({ page }) => {
    const account = secondaryAccount();
    await page.goto('/login');
    await page.getByLabel('Usuario', { exact: true }).fill(account.username);
    await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
    const links = await page.getByRole('navigation', { name: 'Áreas de IDAF' }).getByRole('link').allTextContents();
    expect(links).toEqual([
      'Inicio',
      'Inventario',
      'Descubrimiento',
      'Conexiones',
      'Diagnósticos',
      'Topología',
      'Observabilidad',
    ]);
  });

  test('contraseña incorrecta, usuario inexistente y campos vacíos → el mismo mensaje genérico, sin sesión (SC-003)', async ({
    page,
  }) => {
    const account = primaryAccount();
    await page.goto('/login');

    await page.getByLabel('Usuario', { exact: true }).fill(account.username);
    await page.getByLabel('Contraseña', { exact: true }).fill('contraseña-incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Usuario', { exact: true }).fill('usuario-que-no-existe');
    await page.getByLabel('Contraseña', { exact: true }).fill('lo-que-sea');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');

    await page.getByLabel('Usuario', { exact: true }).fill('');
    await page.getByLabel('Contraseña', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('10 intentos incorrectos seguidos → mismo mensaje, sin bloqueo; el siguiente intento válido funciona (FR-007; CL-02)', async ({
    page,
  }) => {
    const account = primaryAccount();
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/login');
    for (let i = 0; i < 10; i++) {
      await page.getByLabel('Usuario', { exact: true }).fill(account.username);
      await page.getByLabel('Contraseña', { exact: true }).fill(`intento-incorrecto-${i}`);
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
      await expect(page).toHaveURL(/\/login$/);
    }
    expect(errors).toEqual([]);

    await page.getByLabel('Usuario', { exact: true }).fill(account.username);
    await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
  });

  test('servicio de autenticación detenido → mensaje distinto de "no se pudo verificar", sin sesión (SC-027; FR-056)', async ({
    page,
  }) => {
    const account = primaryAccount();
    // Simula el servicio caído interceptando /api/auth/login y devolviendo un
    // error de red — mismo resultado observable que detener el proceso real.
    await page.route('**/api/auth/login', (route) => route.abort('connectionrefused'));

    await page.goto('/login');
    await page.getByLabel('Usuario', { exact: true }).fill(account.username);
    await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toHaveText('No se pudo verificar el acceso. Inténtalo de nuevo.');
    await expect(page).toHaveURL(/\/login$/);

    await page.unroute('**/api/auth/login');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
  });

  test('abrir /login con sesión activa redirige a Inicio sin cerrar la sesión (SC-028; FR-057)', async ({ page }) => {
    const account = primaryAccount();
    await page.goto('/login');
    await page.getByLabel('Usuario', { exact: true }).fill(account.username);
    await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();

    await page.goto('/login');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
    expect(await page.locator('input[type="password"]').count()).toBe(0);

    const sessionResponse = await page.request.get('/api/auth/session');
    expect(await sessionResponse.json()).toMatchObject({ authenticated: true });
  });
});

function screenBrand(page: import('@playwright/test').Page) {
  return page.getByRole('heading', { name: 'IDAF' });
}

test('el catálogo de cuentas E2E tiene al menos dos cuentas y una con displayName ≥ 40 caracteres (FR-052; SC-020)', () => {
  const accounts = loadE2eAccounts();
  expect(accounts.length).toBeGreaterThanOrEqual(2);
  expect(accounts.some((a) => a.displayName.length >= 40)).toBe(true);
});
