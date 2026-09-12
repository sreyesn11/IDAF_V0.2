import { createServer as createHttpServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { loadAccountsFromEnv, createAccountStore } from './accounts.mjs';

const COOKIE_NAME = 'idaf_sid';

/** `Map` de sesiones en memoria (contract §A5.2; data-model §4.3). */
export function createSessionStore() {
  const sessions = new Map();
  return {
    create(username) {
      const sessionId = randomBytes(32).toString('base64url');
      sessions.set(sessionId, { username, createdAt: Date.now() });
      return sessionId;
    },
    get(sessionId) {
      return sessions.get(sessionId);
    },
    destroy(sessionId) {
      sessions.delete(sessionId);
    },
  };
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (!key) continue;
    cookies[key] = decodeURIComponent(part.slice(separator + 1).trim());
  }
  return cookies;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('bad_json'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    ...extraHeaders,
  });
  res.end(payload);
}

function sessionCookie(sessionId, { secure }) {
  return `${COOKIE_NAME}=${sessionId}; HttpOnly; SameSite=Strict; Path=/${secure ? '; Secure' : ''}`;
}

function expiredSessionCookie({ secure }) {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;
}

/**
 * Fábrica del manejador HTTP (contract §A). `getStore()` puede lanzar o
 * devolver un valor falsy para representar «verificación no disponible»
 * (catálogo no cargado / error inesperado) — siempre se traduce a `503`,
 * **nunca** a `401` (§A1.5). Separado de `main()` para poder probarlo sin
 * abrir un socket real (`tests/unit/auth-service.test.ts`, entorno node).
 */
export function createApp({ getStore, sessions = createSessionStore(), secure = false }) {
  return async function handleRequest(req, res) {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      return sendJson(res, 400, { error: 'bad_request' });
    }
    const { pathname } = url;
    const cookies = parseCookies(req.headers.cookie);

    try {
      if (req.method === 'GET' && pathname === '/health') {
        return sendJson(res, 200, { status: 'ok' });
      }

      if (req.method === 'POST' && pathname === '/api/auth/login') {
        let body;
        try {
          body = await readJsonBody(req);
        } catch {
          return sendJson(res, 400, { error: 'bad_request' });
        }
        const { username, password } = body ?? {};
        if (typeof username !== 'string' || typeof password !== 'string') {
          // Campo ausente o de tipo incorrecto: petición malformada (§A1,
          // fila "Petición malformada"). Los campos vacíos SÍ son strings
          // válidos y caen en la rama de abajo → 401 genérico (FR-004/005).
          return sendJson(res, 400, { error: 'bad_request' });
        }

        let store;
        try {
          store = getStore();
        } catch {
          store = undefined;
        }
        if (!store) {
          return sendJson(res, 503, { error: 'unavailable' });
        }

        const result = store.verify(username, password);
        if (!result.ok) {
          return sendJson(res, 401, { error: 'invalid_credentials' });
        }

        const sessionId = sessions.create(result.user.username);
        return sendJson(res, 200, { user: result.user }, { 'Set-Cookie': sessionCookie(sessionId, { secure }) });
      }

      if (req.method === 'GET' && pathname === '/api/auth/session') {
        const sessionId = cookies[COOKIE_NAME];
        const session = sessionId ? sessions.get(sessionId) : undefined;
        if (!session) return sendJson(res, 200, { authenticated: false });

        let store;
        try {
          store = getStore();
        } catch {
          store = undefined;
        }
        const user = store ? store.getDisplayedUser(session.username) : undefined;
        if (!user) return sendJson(res, 200, { authenticated: false });
        return sendJson(res, 200, { authenticated: true, user });
      }

      if (req.method === 'POST' && pathname === '/api/auth/logout') {
        const sessionId = cookies[COOKIE_NAME];
        if (sessionId) sessions.destroy(sessionId);
        res.writeHead(204, { 'Set-Cookie': expiredSessionCookie({ secure }) });
        return res.end();
      }

      return sendJson(res, 404, { error: 'not_found' });
    } catch {
      // Error inesperado: nunca se traduce a 401 (A1.5) ni expone detalle.
      return sendJson(res, 503, { error: 'unavailable' });
    }
  };
}

function main() {
  const port = Number(process.env.IDAF_AUTH_PORT ?? 8787);
  let store;
  try {
    store = createAccountStore(loadAccountsFromEnv());
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'IDAF: no se pudo cargar el catálogo de cuentas');
    process.exit(1);
  }
  const sessions = createSessionStore();
  const app = createApp({ getStore: () => store, sessions });
  const server = createHttpServer(app);
  server.listen(port, () => {
    console.log(`IDAF: servicio de autenticación escuchando en http://localhost:${port}`);
  });
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main();
}
