import { authClient } from '../../src/auth/authClient';

function mockFetchOnce(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authClient.login() (contract auth-and-session.md §C2)', () => {
  it('200 → { ok: true, user } y hace POST a /api/auth/login', async () => {
    const fetchMock = mockFetchOnce({
      status: 200,
      json: async () => ({ user: { username: 'alice', displayName: 'Alice' } }),
    });
    const result = await authClient.login('alice', 'secret');
    expect(result).toEqual({ ok: true, user: { username: 'alice', displayName: 'Alice' } });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });

  it('401 → { ok:false, reason: "invalid_credentials" }', async () => {
    mockFetchOnce({ status: 401, json: async () => ({ error: 'invalid_credentials' }) });
    expect(await authClient.login('alice', 'wrong')).toEqual({ ok: false, reason: 'invalid_credentials' });
  });

  it('400 → { ok:false, reason: "invalid_credentials" }', async () => {
    mockFetchOnce({ status: 400, json: async () => ({ error: 'bad_request' }) });
    expect(await authClient.login('', '')).toEqual({ ok: false, reason: 'invalid_credentials' });
  });

  it('503 → { ok:false, reason: "unavailable" }', async () => {
    mockFetchOnce({ status: 503, json: async () => ({ error: 'unavailable' }) });
    expect(await authClient.login('alice', 'secret')).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('un error de red → { ok:false, reason: "unavailable" } (FR-056)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    expect(await authClient.login('alice', 'secret')).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('nunca contacta otro origen (URL relativa) — C6', async () => {
    const fetchMock = mockFetchOnce({
      status: 200,
      json: async () => ({ user: { username: 'a', displayName: 'A' } }),
    });
    await authClient.login('a', 'b');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/login');
  });

  it('no escribe en sessionStorage/localStorage (C5) — sin estado propio', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    mockFetchOnce({ status: 200, json: async () => ({ user: { username: 'a', displayName: 'A' } }) });
    await authClient.login('a', 'super-secret');
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});

describe('authClient.fetchSession() (contract §C3)', () => {
  it('hace GET a /api/auth/session y devuelve el cuerpo tal cual', async () => {
    const fetchMock = mockFetchOnce({
      json: async () => ({ authenticated: true, user: { username: 'a', displayName: 'A' } }),
    });
    const result = await authClient.fetchSession();
    expect(result).toEqual({ authenticated: true, user: { username: 'a', displayName: 'A' } });
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({ credentials: 'same-origin' }));
  });

  it('propaga (rechaza) un error de red — a diferencia de login(), no lo colapsa (D8)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    await expect(authClient.fetchSession()).rejects.toThrow();
  });
});

describe('authClient.logout() (contract §C4)', () => {
  it('hace POST a /api/auth/logout', async () => {
    const fetchMock = mockFetchOnce({ ok: true } as Partial<Response>);
    await authClient.logout();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });

  it('resuelve siempre, incluso ante un error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    await expect(authClient.logout()).resolves.toBeUndefined();
  });
});
