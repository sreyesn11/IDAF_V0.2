#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scryptSync } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Cuentas desechables NO secretas, con datos FIJOS (no aleatorios) para que
 * la salida sea idéntica en cada ejecución (idempotente — T012). Solo para
 * desarrollo local y E2E; nunca usar en un entorno real (contract §B4).
 */
const DEV_ACCOUNTS = [
  {
    username: 'operador',
    password: 'operador-dev-2026',
    displayName: 'Operador de red',
    salt: 'b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfe',
  },
  {
    username: 'admin',
    password: 'admin-dev-2026',
    // ≥ 40 caracteres a propósito, para ejercitar el truncado de identificador
    // largo (FR-045; SC-020).
    displayName: 'Responsable de Infraestructura de Red, Conectividad e IoT',
    salt: '243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c8',
  },
];

function toCatalogEntry({ username, password, displayName, salt }) {
  const passwordHash = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
  return { username, displayName, salt, passwordHash };
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/**
 * Genera `server/accounts.dev.json` (catálogo — sólo campos del contrato) y
 * `tests/fixtures/accounts.e2e.json` (el mismo catálogo + `password` en claro,
 * que consume el helper `loginAs()` de los E2E). Ambos archivos están
 * ignorados por git.
 */
export function writeDevAccountFixtures() {
  const catalog = DEV_ACCOUNTS.map(toCatalogEntry);
  const e2eFixture = DEV_ACCOUNTS.map((account, i) => ({ ...catalog[i], password: account.password }));

  writeJson(resolve(ROOT, 'server/accounts.dev.json'), catalog);
  writeJson(resolve(ROOT, 'tests/fixtures/accounts.e2e.json'), e2eFixture);

  return { catalog, accounts: DEV_ACCOUNTS };
}

function main() {
  writeDevAccountFixtures();
  console.log('IDAF: cuentas de desarrollo generadas (NO son secretas, solo para desarrollo/E2E):');
  for (const account of DEV_ACCOUNTS) {
    console.log(
      `  usuario="${account.username}"  contraseña="${account.password}"  displayName="${account.displayName}"`,
    );
  }
  console.log('Archivos: server/accounts.dev.json, tests/fixtures/accounts.e2e.json (ambos ignorados por git).');
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main();
}
