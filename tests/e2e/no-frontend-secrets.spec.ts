import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../../dist');
const REPO_ROOT = path.resolve(__dirname, '../..');

function collectFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

test.describe('Sin material de verificación de credenciales en el bundle construido (SC-025)', () => {
  test('dist/ no contiene contraseñas, hashes, sales ni un verificador de credenciales', async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Comprobación de archivos: no depende del navegador, basta una vez');

    const files = collectFiles(DIST_DIR).filter((f) => /\.(js|css|html)$/.test(f));
    expect(files.length).toBeGreaterThan(0);

    const forbidden = [/scrypt/i, /timingSafeEqual/i, /passwordHash/i, /accounts\.(example|dev)\.json/i];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        expect(pattern.test(content), `${pattern} encontrado en ${path.relative(DIST_DIR, file)}`).toBe(false);
      }
    }
  });

  test('git ls-files no incluye ningún archivo de cuentas real, sólo (si está versionado) accounts.example.json', async ({
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Comprobación de git: no depende del navegador, basta una vez');

    const tracked = execSync('git ls-files', { cwd: REPO_ROOT }).toString().split('\n').filter(Boolean);
    const accountFiles = tracked.filter((f) => /accounts.*\.json$/i.test(f));
    // La propiedad de seguridad importante: ningún catálogo REAL (dev/E2E)
    // llega nunca a versionarse. `accounts.example.json` sólo placeholders,
    // así que su presencia es aceptable; su ausencia (p. ej. si aún no se ha
    // hecho `git add`) también lo es — no es lo que esta prueba vigila.
    const realAccountFiles = accountFiles.filter((f) => !f.endsWith('accounts.example.json'));
    expect(realAccountFiles).toEqual([]);
  });
});
