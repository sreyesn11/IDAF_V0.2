# Servicio de autenticación de IDAF

Proceso Node 20 (ESM, sólo módulos nativos: `node:http`, `node:crypto`).
Contrato completo en
[`specs/002-visual-identity-design/contracts/auth-and-session.md`](../specs/002-visual-identity-design/contracts/auth-and-session.md).

## Configurar el catálogo de cuentas

El catálogo **nunca** vive en el código fuente. Se configura en tiempo de
ejecución con **una** de estas dos variables de entorno:

- `IDAF_ACCOUNTS_FILE` — ruta a un archivo JSON **fuera del repositorio**.
- `IDAF_ACCOUNTS` — el mismo JSON en la propia variable de entorno.

Formato (ver `accounts.example.json` para placeholders):

```jsonc
[
  {
    "username": "operador",
    "displayName": "Operador de red",
    "salt": "<hex, ≥ 32 caracteres>",
    "passwordHash": "<scrypt(password, salt) en hex>"
  }
]
```

Si ninguna variable está definida, o el catálogo está mal formado, el
servicio **no arranca** e imprime un error explícito (sin volcar el
contenido del catálogo).

## Generar un hash de contraseña

```bash
node scripts/hash-account.mjs "MI_CLAVE"
# imprime { "salt": "...", "passwordHash": "..." } para pegar en el catálogo
```

## Cuentas de desarrollo / E2E

```bash
npm run auth:seed
```

Genera `server/accounts.dev.json` y `tests/fixtures/accounts.e2e.json`
(**ambos ignorados por git**) con cuentas **desechables y NO secretas**,
pensadas solo para ejecutar la demo local y la suite E2E. Sus credenciales se
imprimen en texto plano por el propio script — no protegen nada real y pueden
compartirse sin problema.

## Arrancar el servicio

```bash
npm run auth
```

Usa `IDAF_AUTH_PORT` (por defecto `8787`). Si no hay `.env`, apunta manualmente
`IDAF_ACCOUNTS_FILE=server/accounts.dev.json` tras ejecutar `npm run auth:seed`.

## Endpoints

`POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`,
`GET /health`. El frontend nunca importa este servicio: le habla solo por HTTP
a través de `src/auth/authClient.ts`.
