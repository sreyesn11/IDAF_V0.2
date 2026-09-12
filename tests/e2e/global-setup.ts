import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — módulo .mjs sin declaraciones de tipos; sólo se usa en Node.
import { writeDevAccountFixtures } from '../../scripts/seed-dev-accounts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright `globalSetup` (T012): genera `tests/fixtures/accounts.e2e.json`
 * de forma idempotente si falta, para que ningún E2E dependa de recordar
 * ejecutar `npm run auth:seed` a mano.
 */
export default async function globalSetup(): Promise<void> {
  const fixturePath = path.resolve(__dirname, '../fixtures/accounts.e2e.json');
  if (!existsSync(fixturePath)) {
    writeDevAccountFixtures();
  }
}
