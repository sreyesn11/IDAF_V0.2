import { createServer, type Server } from 'node:http';
import { randomBytes, scryptSync } from 'node:crypto';
import { createAccountStore, parseAccountsCatalog } from '../../server/accounts.mjs';
import { createApp, createSessionStore } from '../../server/index.mjs';

function buildAccount(username: string, password: string, displayName: string) {
  const salt = randomBytes(32).toString('hex');
  const passwordHash = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
  return { username, displayName, salt, passwordHash };
}

function listen(server: Server): Promise<string> {
  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

describe('server/accounts.mjs — catálogo + verificador (contract §A1.1-A1.2, §B)', () => {
  const alice = buildAccount('alice', 'correct-horse', 'Alice Operadora');
  const store = createAccountStore([alice]);

  it('parsea un catálogo bien formado', () => {
    expect(() => parseAccountsCatalog(JSON.stringify([alice]))).not.toThrow();
  });

  it('rechaza un catálogo vacío, malformado o con campos faltantes', () => {
    expect(() => parseAccountsCatalog('[]')).toThrow();
    expect(() => parseAccountsCatalog('not json')).toThrow();
    expect(() => parseAccountsCatalog(JSON.stringify([{ username: 'x' }]))).toThrow();
  });

  it('verify() devuelve la identidad con credenciales válidas', () => {
    expect(store.verify('alice', 'correct-horse')).toEqual({
      ok: true,
      user: { username: 'alice', displayName: 'Alice Operadora' },
    });
  });

  it('verify() devuelve la MISMA forma de fallo para contraseña incorrecta y usuario inexistente', () => {
    expect(store.verify('alice', 'nope')).toEqual({ ok: false });
    expect(store.verify('ghost', 'whatever')).toEqual({ ok: false });
  });

  it('getDisplayedUser() resuelve la identidad mostrada por username', () => {
    expect(store.getDisplayedUser('alice')).toEqual({ username: 'alice', displayName: 'Alice Operadora' });
    expect(store.getDisplayedUser('ghost')).toBeUndefined();
  });
});

describe('server/index.mjs — contrato HTTP (contract §A)', () => {
  let server: Server;
  let baseUrl: string;
  const alice = buildAccount('alice', 'correct-horse', 'Alice Operadora');
  const store = createAccountStore([alice]);

  beforeAll(async () => {
    const app = createApp({ getStore: () => store, sessions: createSessionStore() });
    server = createServer(app);
    baseUrl = await listen(server);
  });

  afterAll(async () => {
    await close(server);
  });

  async function login(body: unknown): Promise<Response> {
    return fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('GET /health responde { status: "ok" }', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('credenciales válidas → 200 con identidad + cookie de sesión HttpOnly', async () => {
    const res = await login({ username: 'alice', password: 'correct-horse' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: { username: 'alice', displayName: 'Alice Operadora' } });
    expect(res.headers.get('set-cookie')).toMatch(/idaf_sid=.*HttpOnly/i);
  });

  it('contraseña incorrecta y usuario inexistente devuelven el mismo 401 (FR-004/005)', async () => {
    const wrong = await login({ username: 'alice', password: 'nope' });
    const unknown = await login({ username: 'ghost', password: 'whatever' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: 'invalid_credentials' });
    expect(await unknown.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('campos vacíos → el mismo 401 genérico (FR-006 lo evita en el cliente; el servicio lo trata igual)', async () => {
    const res = await login({ username: '', password: '' });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('un campo ausente → 400 bad_request (nunca 401)', async () => {
    const res = await login({ username: 'alice' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_request' });
  });

  it('JSON malformado → 400 bad_request', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(res.status).toBe(400);
  });

  it('fallo interno (catálogo no cargado) → 503, nunca 401 (§A1.5)', async () => {
    const brokenApp = createApp({ getStore: () => undefined, sessions: createSessionStore() });
    const brokenServer = createServer(brokenApp);
    const brokenUrl = await listen(brokenServer);
    try {
      const res = await fetch(`${brokenUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'correct-horse' }),
      });
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: 'unavailable' });
    } finally {
      await close(brokenServer);
    }
  });

  it('ciclo de sesión: login → session la reconoce → logout la invalida', async () => {
    const loginRes = await login({ username: 'alice', password: 'correct-horse' });
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, { headers: { Cookie: cookie } });
    expect(await sessionRes.json()).toEqual({
      authenticated: true,
      user: { username: 'alice', displayName: 'Alice Operadora' },
    });

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
    expect(logoutRes.status).toBe(204);

    const afterLogout = await fetch(`${baseUrl}/api/auth/session`, { headers: { Cookie: cookie } });
    expect(await afterLogout.json()).toEqual({ authenticated: false });
  });

  it('sin cookie de sesión → { authenticated: false }', async () => {
    const res = await fetch(`${baseUrl}/api/auth/session`);
    expect(await res.json()).toEqual({ authenticated: false });
  });

  it('nunca escribe credenciales en stdout/stderr (FR-055/007)', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    await login({ username: 'alice', password: 'super-secret-marker-value' });
    const output = [...stdoutSpy.mock.calls, ...stderrSpy.mock.calls].map((call) => String(call[0])).join('\n');
    expect(output).not.toContain('super-secret-marker-value');
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('10 intentos fallidos seguidos → mismo 401, sin bloqueo; el 11º con la contraseña correcta funciona (FR-007; CL-02)', async () => {
    const bodies: unknown[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await login({ username: 'alice', password: `wrong-${i}` });
      expect(res.status).toBe(401);
      bodies.push(await res.json());
    }
    for (const body of bodies) {
      expect(body).toEqual({ error: 'invalid_credentials' });
    }
    const finalAttempt = await login({ username: 'alice', password: 'correct-horse' });
    expect(finalAttempt.status).toBe(200);
  });
});
