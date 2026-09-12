import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 4173;
// IPv4 explícito (ver vite.config.ts): evita que "localhost" cuelgue si el
// entorno resuelve/enlaza preferentemente a `::1`.
const baseURL = `http://127.0.0.1:${PORT}`;
const AUTH_PORT = 8787;
const ACCOUNTS_FIXTURE = path.resolve(__dirname, 'tests/fixtures/accounts.e2e.json');

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // T012 — genera tests/fixtures/accounts.e2e.json (idempotente) antes de
  // cualquier E2E; no hace falta ejecutar `npm run auth:seed` a mano.
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'node server/index.mjs',
      url: `http://127.0.0.1:${AUTH_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        IDAF_AUTH_PORT: String(AUTH_PORT),
        IDAF_ACCOUNTS_FILE: ACCOUNTS_FIXTURE,
      },
    },
    {
      command: 'npm run build && npm run preview',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
