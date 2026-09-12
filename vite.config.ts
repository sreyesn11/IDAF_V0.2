import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const AUTH_PORT = process.env.IDAF_AUTH_PORT ?? '8787';
// IPv4 explícito: en algunos entornos Windows, `localhost` sin `host` fijado
// resuelve/enlaza sólo a `::1` (IPv6), y una petición IPv4 se queda colgada
// en vez de fallar rápido. Fijar 127.0.0.1 evita esa ambigüedad.
const AUTH_TARGET = `http://127.0.0.1:${AUTH_PORT}`;

/**
 * `/api` se enruta al servicio mínimo de autenticación (`server/index.mjs`) en
 * dev y en `preview`, para que el navegador vea un único origen (contract
 * auth-and-session §A5.3) y `authClient` pueda usar rutas relativas.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': { target: AUTH_TARGET, changeOrigin: true },
    },
  },
  preview: {
    host: '127.0.0.1',
    proxy: {
      '/api': { target: AUTH_TARGET, changeOrigin: true },
    },
  },
});
