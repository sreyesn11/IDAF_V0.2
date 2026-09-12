import { defineWorkspace } from 'vitest/config';

/**
 * Dos entornos (research D15): jsdom para el frontend (`tests/unit/**`, salvo
 * el servicio) y `node` para `tests/unit/auth-service.test.ts`, que ejercita
 * `server/accounts.mjs` (sólo módulos nativos de Node, sin DOM).
 */
export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      name: 'unit',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/unit/**/*.test.{ts,tsx}'],
      exclude: ['tests/unit/auth-service.test.ts'],
    },
  },
  {
    test: {
      name: 'server',
      environment: 'node',
      globals: true,
      include: ['tests/unit/auth-service.test.ts'],
    },
  },
]);
