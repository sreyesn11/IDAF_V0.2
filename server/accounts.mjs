import { readFileSync } from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const HEX_RE = /^[0-9a-fA-F]+$/;

// Sal fija (constante durante la vida del proceso, no versionada) usada SOLO
// para ejecutar un `scrypt` de relleno cuando el usuario no existe, de modo
// que el tiempo de respuesta sea comparable al de una verificación real
// (contract auth-and-session §A1.2).
const DUMMY_SALT = randomBytes(32).toString('hex');

function validateAccount(entry, index) {
  const problems = [];
  if (!entry || typeof entry !== 'object') {
    problems.push(`entrada ${index}: no es un objeto`);
    return problems;
  }
  if (typeof entry.username !== 'string' || entry.username.length === 0) {
    problems.push(`entrada ${index}: "username" vacío`);
  }
  if (typeof entry.displayName !== 'string' || entry.displayName.length === 0) {
    problems.push(`entrada ${index}: "displayName" vacío`);
  }
  if (typeof entry.salt !== 'string' || entry.salt.length === 0 || !HEX_RE.test(entry.salt)) {
    problems.push(`entrada ${index}: "salt" debe ser hexadecimal no vacío`);
  }
  if (
    typeof entry.passwordHash !== 'string' ||
    entry.passwordHash.length === 0 ||
    !HEX_RE.test(entry.passwordHash)
  ) {
    problems.push(`entrada ${index}: "passwordHash" debe ser hexadecimal no vacío`);
  }
  return problems;
}

/**
 * Valida el catálogo (contract §B2). Nunca incluye el contenido de las
 * cuentas en el mensaje de error — solo el índice y el campo afectado.
 */
export function parseAccountsCatalog(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('IDAF: catálogo de cuentas inválido (JSON malformado)');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('IDAF: catálogo de cuentas inválido (se requiere un array con al menos una cuenta)');
  }
  const problems = [];
  const seen = new Set();
  parsed.forEach((entry, index) => {
    problems.push(...validateAccount(entry, index));
    if (entry && typeof entry.username === 'string') {
      if (seen.has(entry.username)) problems.push(`entrada ${index}: "username" duplicado`);
      seen.add(entry.username);
    }
  });
  if (problems.length > 0) {
    throw new Error(`IDAF: catálogo de cuentas inválido — ${problems.join('; ')}`);
  }
  return parsed;
}

/** Lee `IDAF_ACCOUNTS_FILE` (ruta fuera del repo) o `IDAF_ACCOUNTS` (contract §B1). */
export function loadAccountsFromEnv(env = process.env) {
  const filePath = env.IDAF_ACCOUNTS_FILE;
  const inline = env.IDAF_ACCOUNTS;

  if (filePath) {
    let raw;
    try {
      raw = readFileSync(filePath, 'utf8');
    } catch {
      throw new Error(`IDAF: no se pudo leer IDAF_ACCOUNTS_FILE (${filePath})`);
    }
    return parseAccountsCatalog(raw);
  }
  if (inline) {
    return parseAccountsCatalog(inline);
  }
  throw new Error('IDAF: falta la configuración de cuentas — define IDAF_ACCOUNTS_FILE o IDAF_ACCOUNTS');
}

function scryptHex(password, saltHex) {
  return scryptSync(password, Buffer.from(saltHex, 'hex'), 64).toString('hex');
}

/**
 * Catálogo de cuentas en memoria + verificador (contract §A1.1, §A1.2, §A2.1).
 * `verify` nunca revela si el usuario existe: usuario desconocido y
 * contraseña incorrecta producen el mismo `{ ok: false }`.
 */
export function createAccountStore(accounts) {
  const byUsername = new Map(accounts.map((account) => [account.username, account]));

  function verify(username, password) {
    const account = byUsername.get(username);
    if (!account) {
      scryptHex(password, DUMMY_SALT);
      return { ok: false };
    }
    const candidate = Buffer.from(scryptHex(password, account.salt), 'hex');
    const expected = Buffer.from(account.passwordHash, 'hex');
    const match = candidate.length === expected.length && timingSafeEqual(candidate, expected);
    if (!match) return { ok: false };
    return { ok: true, user: { username: account.username, displayName: account.displayName } };
  }

  function getDisplayedUser(username) {
    const account = byUsername.get(username);
    if (!account) return undefined;
    return { username: account.username, displayName: account.displayName };
  }

  return { verify, getDisplayedUser };
}
