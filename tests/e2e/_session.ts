import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface E2eAccount {
  username: string;
  password: string;
  displayName: string;
}

let cachedAccounts: E2eAccount[] | undefined;

/** Lee `tests/fixtures/accounts.e2e.json` (generado por el `globalSetup`). */
export function loadE2eAccounts(): E2eAccount[] {
  if (!cachedAccounts) {
    const fixturePath = path.resolve(__dirname, '../fixtures/accounts.e2e.json');
    const raw = readFileSync(fixturePath, 'utf8');
    cachedAccounts = JSON.parse(raw) as E2eAccount[];
  }
  return cachedAccounts;
}

/** Primera cuenta del fixture (uso general). */
export function primaryAccount(): E2eAccount {
  return loadE2eAccounts()[0];
}

/** Segunda cuenta del fixture — FR-016: misma experiencia, sólo cambia `displayName`. */
export function secondaryAccount(): E2eAccount {
  return loadE2eAccounts()[1];
}

/** Inicia sesión desde `/login` y espera a llegar a Inicio. */
export async function loginAs(page: Page, account: E2eAccount = primaryAccount()): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill(account.username);
  await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('heading', { level: 1, name: 'Inicio' }).waitFor();
}
