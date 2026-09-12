import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC_ROOT = path.resolve(__dirname, '../../src');

function collectFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const FORBIDDEN_IMPORTS = [/server\/accounts/, /from ['"].*\/server\//];
const FORBIDDEN_PATTERNS = [/scrypt/i, /timingSafeEqual/i, /passwordHash/i, /\bsalt\b/i];

describe('src/ no contiene material de verificación de credenciales (FR-055; SC-025)', () => {
  const files = collectFiles(SRC_ROOT);

  it('encuentra los archivos fuente del frontend (sanity check)', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it('ningún módulo bajo src/ importa server/accounts* ni el propio server/', () => {
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_IMPORTS) {
        expect(content).not.toMatch(pattern);
      }
    }
  });

  it('ningún módulo define hashing ni verificación de contraseñas (scrypt/timingSafeEqual/passwordHash/salt)', () => {
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(pattern.test(content), `Patrón prohibido ${pattern} en ${path.relative(SRC_ROOT, file)}`).toBe(false);
      }
    }
  });
});
