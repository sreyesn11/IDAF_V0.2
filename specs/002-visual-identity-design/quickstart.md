# Quickstart — Validación de la SPEC 002

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Contracts**: [contracts/](./contracts/)

Guía **ejecutable** para poner en marcha la aplicación (frontend + servicio de
autenticación) y validar los criterios de éxito SC-001…SC-038. No contiene código
de implementación; los detalles de diseño están en los contratos y en
`data-model.md`. El protocolo humano normativo (cribado del panel, preguntas
literales, rúbricas, medición de tiempos, re-test) vive en `spec.md` §«Evaluación
con personas»; aquí solo se resume su ejecución.

---

## 1. Prerrequisitos

- Node.js 20 LTS, npm 10+.
- Navegadores de Playwright: `npx playwright install`.
- Dos procesos: el **servicio de autenticación** (`server/`, puerto `8787` por
  defecto) y el **frontend** (Vite dev `5173` o `preview` `4173`). Vite hace
  `proxy` de `/api` hacia el servicio, así que el navegador ve un solo origen.

## 2. Configuración del catálogo de cuentas

El catálogo de credenciales válidas se configura **fuera del código fuente y fuera
del bundle** (Principio VIII). El servicio lee **una** de estas fuentes al
arrancar:

- `IDAF_ACCOUNTS_FILE` → ruta a un JSON **fuera del repositorio**, o
- `IDAF_ACCOUNTS` → el mismo JSON en una variable de entorno.

```bash
cp .env.example .env
# editar .env: IDAF_ACCOUNTS_FILE=/ruta/fuera/del/repo/idaf-accounts.json
```

Formato por cuenta: `{ "username", "displayName", "salt", "passwordHash" }` con
`passwordHash = scrypt(password, salt)`. Generar una entrada:

```bash
node scripts/hash-account.mjs "MI_CLAVE"
# imprime  { "salt": "…", "passwordHash": "…" }  para pegar en el JSON del catálogo
```

**Nunca** se comitea `.env` ni el archivo de cuentas real; el repositorio sólo
contiene `server/accounts.example.json` (placeholders). Ver `server/README.md`.

### Cuentas de desarrollo / E2E (desechables, no secretas)

```bash
npm run auth:seed   # genera server/accounts.dev.json y tests/fixtures/accounts.e2e.json (ambos IGNORADOS por git)
```

Las credenciales que produce (usuario / contraseña en claro, **sólo** para correr
la demo y los tests) quedan impresas por el script y documentadas en
`server/README.md` como **no secretas**. El conjunto incluye al menos dos cuentas
(FR-052) y una con un `displayName` de ≥ 40 caracteres para el caso de texto largo
(SC-020).

## 3. Puesta en marcha

```bash
npm install
npm run auth:seed          # cuentas de desarrollo (opcional para la demo; los E2E lo ejecutan solos vía global setup)
npm run auth               # terminal 1 — servicio de autenticación (usa server/accounts.dev.json si no hay .env)
npm run dev                # terminal 2 — frontend en http://localhost:5173 (proxy /api → 8787)
# alternativa equivalente a la de los E2E:
npm run build && npm run preview   # http://localhost:4173 (preview.proxy /api → 8787)
```

Primera pantalla esperada: **Login** (no Inicio) — SC-001.

## 4. Pruebas automatizadas

```bash
npm test           # Vitest: frontend (jsdom) + servicio de autenticación (entorno node)
npm run test:e2e   # Playwright (Chromium, Firefox, WebKit) — webServer arranca el servicio + preview
```

`npm run test:e2e` ejecuta primero un *global setup* (`tests/e2e/global-setup.ts`)
que genera `tests/fixtures/accounts.e2e.json` de forma idempotente si falta: no hace
falta acordarse de `npm run auth:seed` a mano antes de los E2E.

`npm run build` incluye `tsc --noEmit`: los cambios de tipos del registro
(`icon`, `description`) y de `authClient`/`SessionProvider` se verifican en
compilación.

### Mapa prueba → requisitos

| Suite | Cubre |
|-------|-------|
| `tests/unit/auth-service.test.ts` | FR-003–FR-007, FR-052, FR-055, FR-056 (validación en el servicio, scrypt, ciclo de sesión, `401` idéntico, `503` en fallo interno, no registra credenciales; **10 intentos fallidos seguidos → `401` idéntico, sin bloqueo, estable tras la ráfaga — CL-02**) |
| `tests/unit/auth-client.test.ts` | FR-003, FR-004, FR-056 (sólo HTTP; `reason` invalid/unavailable; sin secretos en el cliente) |
| `tests/unit/no-frontend-secrets.test.ts` | FR-055 · SC-025 (nada de material de verificación en `src/`) |
| `tests/unit/session-provider.test.tsx` | FR-009, FR-011, FR-013, FR-051, FR-057, FR-058 |
| `tests/unit/login-view.test.tsx` | FR-002, FR-004–FR-006, FR-054, FR-056 |
| `tests/unit/require-session.test.tsx` | FR-001, FR-008, FR-010, FR-014 |
| `tests/unit/home-view.test.tsx` | FR-059 · SC-030 |
| `tests/unit/primary-nav.test.tsx` | FR-018–FR-025 (activo: ≥2 señales, ≥1 no cromática); SC-031 (exactamente uno activo; ≥2 propiedades, ≥1 no cromática); SC-038 (combinación (nombre,icono) única) |
| `tests/unit/visual-criteria.test.tsx` | SC-032 (sin gráficos decorativos), SC-033 (transition/animation ≤150ms, iteration-count finito), SC-034 (line-height contenido ≥1,4), SC-035 (h1 ≤2× cuerpo; hit-target ≥24×24) — FR-030, FR-042. **US2, sólo Login + Inicio y sólo lo disponible en esa fase**; los criterios que dependen de `ModuleHeader`/`Surface`/estructura definitiva de Inicio (incl. huecos ≤1,5× ModuleHeader) se difieren a `structure-consistency.spec.ts` / T066 (US5). Cobertura por áreas: `structure-consistency.spec.ts` = Inicio + shell (US5); `unavailable-modules.spec.ts` = 6 vistas «No disponible» (US6); `global-consistency.spec.ts` = pasada final de las 7 áreas + divergencia global = 0 (Polish) |
| `tests/unit/session-bar.test.tsx` | FR-012, FR-015, FR-045 |
| `tests/unit/module-header.test.tsx` | FR-031–FR-033 |
| `tests/unit/module-unavailable.test.tsx` | FR-043, FR-044 |
| `tests/unit/status-badge.test.tsx` | FR-039, FR-041 |
| `tests/unit/registry.test.ts` | FR-017, FR-019, FR-020, FR-025; SC-038 (sin entradas duplicadas; fuente única) |
| `tests/unit/tokens.test.ts` | FR-037, FR-040, FR-042; SC-034/SC-035 (escala: h1 ≤2× cuerpo; line-height cuerpo ≥1,4; `--motion-fast` ≤150ms) |
| `tests/e2e/auth-login.spec.ts` | US1 · SC-001, SC-002, SC-003, SC-027, SC-028; FR-007/CL-02 (10 intentos incorrectos seguidos → mismo mensaje, sin bloqueo, login válido después), FR-016 (2.ª cuenta predefinida → mismo shell, mismas 7 áreas). **SC-002 = aserción de tiempo dura**: `t0` = activar «Iniciar sesión» con credenciales válidas; `t1` = el `<h1>` de Inicio tiene el foco y la nav de 7 áreas es visible; `t1 − t0 < 30 000 ms` medido con el reloj del *test runner*; la prueba **falla** si se supera el umbral (ver E2 · paso 3 y spec §«Medición de tiempos») |
| `tests/e2e/session-logout.spec.ts` | US4 · SC-004, SC-008, SC-009 |
| `tests/e2e/session-persistence.spec.ts` | US7 · SC-005, SC-024 |
| `tests/e2e/multi-tab-logout.spec.ts` | US4 · SC-029 |
| `tests/e2e/nav-icons-active.spec.ts` | US3 · SC-010, SC-011, SC-012, SC-013, SC-031 |
| `tests/e2e/product-identity.spec.ts` | US2 · **Login + Inicio** — SC-006, SC-007, SC-017, SC-037 (Login: brand+propósito+mismos componentes, sin adornos); FR-027 (a)–(c) aquí, (d)/(e) diferidos a US5. La verificación conjunta de SC-036 (FR-027 a–e) y la revisión cruzada de las 7 áreas se cierran en `global-consistency.spec.ts` (Polish) |
| `tests/e2e/home-overview.spec.ts` | US5 · SC-030 |
| `tests/e2e/unavailable-modules.spec.ts` | US6 · SC-014; SC-032/SC-033/SC-034/SC-035 sobre las **6 vistas «No disponible»** (se construyen en esta fase) |
| `tests/e2e/structure-consistency.spec.ts` | US5 · **Inicio + las 4 zonas del shell** — SC-017, SC-018; consistencia de los componentes finalizados en US5; runtime SC-032/SC-033/SC-034/SC-035 sobre Inicio y el chrome. La revisión FR-036/SC-019 sobre las 7 áreas y la divergencia global = 0 se hacen en `global-consistency.spec.ts` (Polish) |
| `tests/e2e/global-consistency.spec.ts` | **Polish (T089)** · FR-036 (9 aspectos) sobre las **7 áreas** con divergencia global = 0 · SC-019; SC-032/SC-033/SC-034/SC-035 sobre las 7 vistas + Login — tras completar US5 y US6 |
| `tests/e2e/keyboard-a11y.spec.ts` | FR-054 · SC-022 |
| `tests/e2e/no-frontend-secrets.spec.ts` | FR-055 · SC-025 (escaneo de `dist/`) |
| `tests/e2e/unknown-route.spec.ts` | FR-053 · SC-023 |
| `tests/e2e/edge-cases.spec.ts` | US7 · SC-020, SC-021 |

Manual (panel de personas, ver spec §«Evaluación con personas» — protocolo
normativo): SC-006, SC-007, SC-009, SC-010, SC-013, y la cronometría de SC-008.
Manual (inspección): SC-025, SC-026. Manual (checklist): SC-015, SC-016, y la
comprobación estructural de SC-036 (FR-027 a–e) y SC-037 (condiciones de la
pantalla de acceso) que complementa a `product-identity.spec.ts`.

## 5. Escenarios de validación end-to-end (runnable)

Cada escenario indica pasos y resultado esperado. Salvo indicación, se parte de
`npm run preview` en `http://localhost:4173` con el servicio de autenticación
arrancado y sin sesión (`sessionStorage` vacío, sin cookie).

### E1 · Acceso obligatorio (SC-001) — automatizable

1. Abrir `/`. → Se muestra **Login**; ninguna entrada de navegación de área en el
   DOM.
2. Abrir directamente `/topologia`. → **Login** (no Topología).

### E2 · Inicio de sesión válido (SC-002) — automatizable

1. En Login, escribir usuario y contraseña válidos (cuenta de desarrollo).
2. Activar **Iniciar sesión**. → El servicio responde `200` y emite la cookie de
   sesión; se llega a **Inicio** con la navegación de las 7 áreas visible. El foco
   queda en el `<h1>` de Inicio.
3. **Cronometría (SC-002)**: `t0` = instante en que se activa **Iniciar sesión**
   con credenciales válidas ya escritas; `t1` = el `<h1>` de Inicio recibe el foco
   y la navegación de las 7 áreas es visible; instrumento = marca de tiempo del
   *test runner* (Playwright). Aserción **dura** en `auth-login.spec.ts` (T036):
   `expect(t1 − t0).toBeLessThan(30000)`; la prueba **falla** si se supera el
   umbral. (Ver spec §«Evaluación con personas» → «Medición de tiempos».)
4. **Igualdad entre cuentas (FR-016)**: cerrar sesión y repetir los pasos 1–2 con
   una **segunda** cuenta de desarrollo. → Mismo AppShell, las mismas 7 áreas, la
   misma navegación y las mismas acciones de sesión; sólo cambia el `displayName`.
   No hay roles, perfiles ni permisos diferenciados.

### E3 · Credenciales inválidas y campos vacíos (SC-003) — automatizable

1. Usuario válido + contraseña incorrecta → **Iniciar sesión**. → El servicio
   responde `401`; permanece en Login; aparece **un** mensaje genérico («Usuario o
   contraseña incorrectos.») que **no** dice qué campo falló. El foco pasa al
   mensaje (o permanece en el campo Usuario).
2. Usuario inexistente + cualquier contraseña. → Mismo `401`, mismo mensaje,
   tiempo de respuesta comparable.
3. Dejar Usuario vacío → **Iniciar sesión**. → No se llama al servicio; indicación
   de campo requerido.
4. Repetir **10** intentos incorrectos seguidos (número fijo y repetible). → Cada
   respuesta es el mismo `401` genérico; sin errores en consola, sin bloqueo de
   cuenta, sin acceso (FR-007 · CL-02). El servicio no registra las credenciales. El
   intento siguiente con la contraseña correcta inicia sesión con normalidad
   (comportamiento estable tras la ráfaga).

### E3b · Verificación de acceso no disponible (SC-027) — automatizable

1. **Detener el servicio de autenticación** (o apuntar el proxy a un puerto sin
   servicio).
2. Escribir credenciales válidas → **Iniciar sesión**. → `authClient` recibe
   `5xx`/error de red → `{ ok:false, reason:'unavailable' }`; permanece en Login;
   aparece un mensaje **distinto** del de credenciales («No se pudo verificar el
   acceso. Inténtalo de nuevo.»); **no** se crea sesión ni se escribe el marcador.
3. Reanudar el servicio y reintentar con las mismas credenciales → acceso normal.

### E3c · Acceso con sesión activa (SC-028) — automatizable

1. Iniciar sesión. 2. Navegar manualmente a `/login`. → Redirige a **Inicio**; no
   se muestra un segundo formulario; `GET /api/auth/session` sigue respondiendo
   `{ authenticated: true }` (la sesión no se cerró).

### E4 · Identidad de sesión y cierre de sesión (SC-004, SC-008, SC-009) — automatizable + manual

1. Con sesión, recorrer las 7 áreas. En cada una: la identidad del usuario
   (`displayName`, del servicio) y el botón **Cerrar sesión** están visibles en el
   header, en una zona separada de la navegación.
   *(Manual, SC-008)* Cronometría: `t0` = el facilitador termina de leer «Encuentra
   quién ha iniciado sesión y cómo se cierra la sesión»; `t1` = el evaluador señala
   o enfoca **ambos** (identificación de usuario y control «Cerrar sesión»);
   instrumento = cronómetro digital (0,1 s) medido sobre la grabación de pantalla
   en revisión posterior. Umbral: `t1 − t0` < 5,0 s.
2. *(Manual, SC-009)* Tras recorrer 2–3 áreas, instrucción literal «Cierra la
   sesión»; el facilitador no señala ningún control. Se registra el primer control
   tocado y cualquier frase emitida. Aprobado si **ningún** evaluador: (a) usa un
   control del área de contenido como intento de logout, (b) verbaliza
   incertidumbre sobre qué control usar, o (c) tarda > 10 s en dirigirse a «Cerrar
   sesión» del header. (Rúbrica completa: spec §«Evaluación con personas».)
3. Activar **Cerrar sesión** desde `/diagnosticos`. → `POST /api/auth/logout`; el
   servicio invalida la sesión y vacía la cookie; se vuelve a **Login**; el foco
   queda en el campo Usuario.
4. Tras cerrar sesión, abrir `/inventario`. → **Login** (SC-004). Una llamada
   manual a `GET /api/auth/session` responde `{ authenticated: false }`.

### E5 · Persistencia de sesión (SC-005, SC-024) — automatizable

1. Iniciar sesión, ir a `/observabilidad`, pulsar **F5**. → `SessionProvider`
   rehidrata (`GET /api/auth/session` → `authenticated: true`); sigue en
   Observabilidad, navegación visible.
2. Sin sesión, abrir `/observabilidad` y recargar. → **Login**.
3. Simular cierre de pestaña: en DevTools, vaciar `sessionStorage`, recargar. →
   **Login** (el marcador no está; el cliente no consulta o el servicio deja de
   reconocerse tras `logout` de higiene) — equivale a CL-08 / SC-024.

### E5b · Cierre de sesión con varias pestañas (SC-029) — automatizable

1. Abrir IDAF en dos pestañas (A y B) e iniciar sesión (comparten cookie de
   sesión). Ir a un área interna en ambas.
2. En la pestaña A, activar **Cerrar sesión**. → A vuelve a Login.
3. Volver a la pestaña B (evento `focus`/`visibilitychange`). → B revalida contra
   `GET /api/auth/session` (`authenticated: false`) y muestra **Login**.
4. Alternativa: en B, recargar → **Login**. Ninguna navegación posterior en B
   accede a las áreas internas (CL-11).

### E6 · Navegación con icono + nombre y estado activo (SC-010–SC-013, SC-031) — automatizable + manual

1. Con sesión, observar la navegación. → 7 entradas, cada una con **icono +
   nombre** visible; combinación (nombre, icono) única, sin entradas duplicadas
   (SC-038).
2. **SC-031** — recorrer las 7 vistas internas. En cada una: exactamente **una**
   entrada activa (cero vistas con ninguna o con más de una), y la entrada activa
   difiere de las inactivas en **≥ 2 propiedades renderizadas** (barra/indicador de
   forma, peso tipográfico, tamaño, icono o fondo), de las que **≥ 1 no es
   cromática** y sigue distinguiéndose con el emulador de acromatopsia activado
   (ver E13.2).
3. Alternar rápido entre 4 áreas **≥ 20** veces (~25). → Siempre una sola activa;
   sin contenido duplicado; sin errores de consola.
4. *(Manual, SC-010)* Cronometría por área: `t0` = la vista queda renderizada y el
   facilitador dice «ya»; `t1` = el evaluador pronuncia el nombre de un área;
   instrumento = cronómetro digital (0,1 s) sobre grabación de pantalla + audio,
   medido en revisión posterior. Umbral: ≤ 3,0 s en las siete áreas, 100 % del
   panel.
5. *(Manual, SC-013)* Mostrar los 7 iconos sin etiqueta + la lista de nombres de
   área; pedir la asociación (P7) y si son la misma familia (P8). Aprobado si:
   media por icono ≥ 0,90, ningún icono < 0,60, y ≥ 80 % del panel responde «Sí» a
   P8.
6. Ocultar los iconos (DevTools: `svg{display:none}`). → Las 7 entradas siguen
   identificables y usables por su nombre (SC-012).

### E7 · Reconocimiento del producto (SC-006, SC-007) — manual

Panel según spec §«Evaluación con personas» (protocolo **normativo**). Cribado:
≥ 5 evaluadores de perfil técnico, sin participación en el diseño y **sin
exposición previa a IDAF ni a los prototipos de SPEC 001/002**. Individual, sin ver
la URL ni la barra de direcciones. Se conserva grabación.

1. **Material** (orden fijo): Login → **Inicio** → **Topología** (vista de módulo
   «No disponible», para cubrir «identidad en cualquier módulo», FR-028).
2. **Preguntas literales** (se leen textualmente): P1 «¿Cómo se llama este
   producto?»; P2 «Describe en una sola frase qué hace este producto.»; P3 (tras
   las tres pantallas) «¿Estas pantallas pertenecen al mismo producto? Sí o No.»;
   P4 «¿Dirías que esto es una herramienta terminada o algo sin terminar? ¿Por
   qué?».
3. **SC-006** — aprobado si el 100 % del panel responde «IDAF» a P1.
4. **SC-007** — aprobado si, para el 100 % del panel: (a) P3 = «Sí»; (b) la frase
   de P2/P4 nombra **a la vez** un concepto de dominio (red/redes/infraestructura
   de red/IoT/dispositivos conectados/nodos) **y** uno de función
   (diagnóstico/observabilidad/monitoreo/supervisión/inventario/descubrimiento/
   topología/análisis de red); (c) P4 no describe el producto **en su conjunto**
   como prototipo/demo/maqueta/sin terminar (un módulo «no disponible» no cuenta).
   Se clasifica como fallo por «plantilla administrativa genérica» toda respuesta
   que solo mencione gestión administrativa sin dominio de red/IoT o que no
   distinga el producto de un panel administrativo cualquiera.
5. **Ambigüedad**: transcribir literalmente; una sola repregunta neutra («¿Puedes
   concretar un poco más?»); si sigue sin encajar en «válida» → fallo. Dos
   revisores clasifican de forma independiente.
6. **Re-test** (SC-006/SC-007 son bloqueantes): un fallo → corregir causa raíz en
   el producto y repetir con panel nuevo; máx. 2 re-tests; luego, decisión
   documentada de la persona propietaria.

### E7b · Inicio en SPEC 002 (SC-030) — automatizable + manual

1. Con sesión, abrir **Inicio**. → Muestra la identidad del producto, la
   explicación breve y la vista general de las siete áreas con su estado
   («Disponible» / «No disponible»). La navegación principal permanece visible.
2. Verificar que **no** hay tablas de datos, métricas, gráficas ni valores que
   parezcan operacionales (FR-034/FR-059).

### E8 · Módulos no disponibles (SC-014) — automatizable

1. Entrar a cada uno de los 6 módulos pendientes. → Cada vista: conserva la
   identidad de IDAF, muestra **icono del módulo + nombre + «No disponible» +
   explicación** de incorporación futura. **Cero** gráficas, dispositivos,
   métricas o botones operativos.

### E9 · Estructura consistente (SC-017–SC-019) — automatizable + manual

**Reparto**: en **US5** la comprobación automatizada (`structure-consistency.spec.ts`
/ T060) se limita a **Inicio + las 4 zonas del shell** y a los componentes ya
finalizados; la revisión cruzada definitiva de las **7 áreas** con divergencia
global = 0 (paso 3 y `global-consistency.spec.ts` / T089) se ejecuta en **Polish**,
una vez completadas US5 y US6.

1. En cualquier vista interna se distinguen 4 zonas: navegación global, identidad
   de producto, contexto de sesión, área de contenido (SC-017).
2. El `<main>` es la región de mayor superficie (SC-018).
3. *(Manual, SC-019 — en Polish, tras US5 + US6)* Revisión cruzada de las 7 áreas con la **misma lista que
   FR-036** (9 aspectos: tipografía, espaciado, estilos de título, comportamiento
   de navegación, iconografía, estados activos, mensajes de error, botones,
   estructura general). **Umbral objetivo**: para cada aspecto, «mismo tratamiento»
   = se produce a partir del mismo token de `tokens.css`, del mismo componente
   compartido o de la misma regla de `base.css`. Cuenta como **una divergencia**
   cada par (área, aspecto) que se resuelva con un token distinto, un componente
   distinto o un valor codificado que no pase por la fuente compartida. Recorrer
   los 7 × 9 = 63 pares (inspector de estilos + búsqueda de literales en el
   código). Aprobado con **divergencias = 0**.

### E10 · Accesibilidad acotada (SC-022) — automatizable

1. Sólo con teclado: recorrer el formulario de Login (incluido el control de
   mostrar/ocultar contraseña), enviarlo, recorrer las 7 entradas de navegación,
   activar **Cerrar sesión** y las acciones de la vista de error de sección. →
   Todo alcanzable y activable, sin trampa de foco; foco siempre visible.
2. Comprobar landmarks: `banner` (header), `navigation` (nav), `main`, y la región
   con nombre `Sesión`.
3. El foco se reubica: al **iniciar** sesión → `<h1>` de Inicio; al **cerrar** →
   campo Usuario; al **fallar** el login (credenciales o «no disponible») → mensaje
   de error o permanece en el formulario. Repetir en los tres navegadores.

### E11 · Ruta desconocida (SC-023) — automatizable

1. Con sesión, abrir `/ruta-inexistente`. → Redirige a **Inicio**, sin error ni
   vista «no encontrado».
2. Sin sesión, abrir `/ruta-inexistente`. → **Login**.

### E12 · Casos límite de estructura (SC-020, SC-021) — automatizable

1. Iniciar sesión con una cuenta cuyo `displayName` tenga ≥ 40 caracteres. → El
   identificador se trunca (elipsis + `title`); la navegación y el contenido no se
   desplazan ni se ocultan.
2. Provocar un mensaje de error de acceso de ≥ 200 caracteres (test con mensaje
   largo inyectado en `content/idaf.ts` o vía prop). → No se superpone a los
   campos ni al botón; la vista sigue usable.
3. Reducir el ancho de la ventana a **1024 px**. → Navegación, identidad de sesión
   y **Cerrar sesión** siguen visibles y utilizables.

### E13 · Contraste y percepción sin color (SC-015, SC-016) — manual

1. *(SC-016 / FR-040 — mismo umbral)* Con axe-core en la consola del navegador (o
   un verificador de contraste), comprobar en Login y en las 7 áreas: texto normal
   ≥ 4.5:1, texto grande y componentes ≥ 3:1 (incluye el anillo de foco frente a su
   fondo).
2. *(SC-015)* Activar escala de grises (DevTools → Rendering → Emulate vision
   deficiencies → Achromatopsia). → El módulo activo y los estados
   correcto/advertencia/error siguen distinguibles por forma/icono/texto.

### E14 · Sin material de verificación en el frontend (SC-025, SC-026) — automatizable + manual

1. *(SC-025)* Ejecutar `tests/unit/no-frontend-secrets.test.ts` y el escaneo del
   `dist/` construido: no aparecen contraseñas, hashes, sales, un verificador de
   credenciales ni el catálogo de cuentas; `git ls-files` no incluye ningún archivo
   de cuentas real (sólo `server/accounts.example.json`).
2. *(SC-026)* Realizar E2/E3/E3b y revisar la consola del navegador y la salida del
   servicio de autenticación: no contienen el usuario ni la contraseña
   introducidos.

### E15 · Densidad, decoración y movimiento (SC-032, SC-033, SC-034, SC-035 — FR-030, FR-042) — automatizable + manual

Cobertura repartida: `tests/unit/visual-criteria.test.tsx` (US2) sobre **Login +
Inicio**, sólo lo disponible en esa fase; `tests/e2e/structure-consistency.spec.ts`
(US5) sobre **Inicio + el shell**; `tests/e2e/unavailable-modules.spec.ts` (US6)
sobre las **6 vistas «No disponible»**; `tests/e2e/global-consistency.spec.ts`
(Polish, T089) hace la **pasada final sobre las 7 áreas + Login** con divergencia
global = 0. Los pasos manuales siguientes son de confirmación.

1. **SC-035** — en Inicio y en cada módulo: `font-size` computado del `<h1>` del
   `ModuleHeader` ≤ 2,0 × el `font-size` del texto de cuerpo; área activa
   (*hit target*) de todo control interactivo ≥ 24 × 24 px; ningún hueco vertical
   continuo sin contenido y sin propósito de altura > 1,5 × la altura renderizada
   del `ModuleHeader`.
2. **SC-034** — `line-height` computado del texto de contenido (cuerpo y párrafos
   de módulo) ≥ 1,4 en Login y en las 7 áreas.
3. **SC-032** — escaneo del DOM: todo `<img>`, `background-image`, `<svg>` y
   `<canvas>` es funcional (símbolo de marca, iconos de nav/UI/estado) o no existe;
   cero elementos gráficos puramente decorativos.
4. **SC-033** — estilos computados: toda `transition-duration` / `animation-duration`
   ≤ 150 ms y todo `animation-iteration-count` es finito; cero animaciones en
   bucle.

## 6. Criterios de aceptación — checklist de cierre

| SC | Método | Bloqueante |
|----|--------|:---:|
| SC-001 Acceso sin sesión → Login; áreas no accesibles | E1 · e2e | ✅ |
| SC-002 Login válido → Inicio < 30 s (t0 = activar «Iniciar sesión»; t1 = foco en `<h1>` + nav visible; *test runner*) | E2 · e2e | ✅ |
| SC-003 Inválido/vacío → Login + mensaje genérico | E3 · e2e | ✅ |
| SC-004 Post-logout, ruta interna → Login | E4 · e2e | ✅ |
| SC-005 Recarga con/sin sesión | E5 · e2e | ✅ |
| SC-006 Evaluadores nombran «IDAF» | E7 · manual (panel, spec §Evaluación con personas) | ✅ |
| SC-007 «Mismo producto», herramienta técnica de redes/IoT | E7 · manual (panel) | ✅ |
| SC-008 Sesión/logout localizables < 5 s (t0/t1 e instrumento: spec §Medición de tiempos; sobre grabación) | E4 · manual (panel) | ⬜ (juicio) |
| SC-009 Nadie confunde «Cerrar sesión» con acción del módulo (conductas (a)–(c) observables; rúbrica en spec) | E4 · manual (panel) | ✅ |
| SC-010 Módulo activo identificable ≤ 3 s (t0 = «ya» tras render; t1 = nombra el área; medido sobre grabación) | E6 · manual (panel) | ⬜ (juicio) |
| SC-011 Exactamente un activo; sin contenido duplicado | E6 · e2e | ✅ |
| SC-012 Nombre + icono; usable con icono oculto | E6 · e2e | ✅ |
| SC-013 Familia única; media/icono ≥ 0,90, piso/icono ≥ 0,60, ≥ 80 % confirma familia | E6 · manual (panel) | ⬜ (juicio) |
| SC-014 6 vistas «No disponible» sin elementos simulados | E8 · e2e | ✅ |
| SC-015 Estados y activo sin color | E13 · manual | ✅ |
| SC-016 Contraste WCAG 2.1 AA | E13 · manual + axe | ✅ |
| SC-017 4 zonas distinguibles | E9 · e2e | ✅ |
| SC-018 `main` = mayor superficie | E9 · e2e | ✅ |
| SC-019 Revisión cruzada de las 7 áreas: cero divergencias (global) | E9 · manual + `global-consistency.spec.ts` (Polish, T089) | ✅ |
| SC-020 Identificador ≥ 40 car. / error ≥ 200 car. no rompen | E12 · e2e | ✅ |
| SC-021 Ancho 1024 px mantiene nav/sesión/logout | E12 · e2e | ✅ |
| SC-022 Todo interactivo por teclado; landmarks; foco al iniciar/cerrar/fallar | E10 · e2e | ✅ |
| SC-023 Ruta desconocida con sesión → Inicio | E11 · e2e | ✅ |
| SC-024 Cierre de pestaña → Login; recarga conserva sesión | E5 · e2e | ✅ |
| SC-025 Sin material de verificación en repo/bundle | E14 · e2e + inspección | ✅ |
| SC-026 Credenciales no aparecen en ningún registro | E14 · manual | ✅ |
| SC-027 Verificación no disponible → Login, mensaje distinto, sin sesión | E3b · e2e | ✅ |
| SC-028 `/login` con sesión → Inicio, sin cerrar sesión | E3c · e2e | ✅ |
| SC-029 Logout multi-pestaña → otras pestañas a Login al reactivar/recargar | E5b · e2e | ✅ |
| SC-030 Inicio: identidad + propósito + 7 áreas con estado; sin datos | E7b · e2e | ✅ |
| SC-031 Exactamente 1 activo; ≥ 2 propiedades, ≥ 1 no cromática (acromatopsia) | E6 · e2e (`nav-icons-active`, `primary-nav`) | ✅ |
| SC-032 Sin gráficos decorativos que compitan con lo funcional | E15 · e2e (`visual-criteria` [Login+Inicio], `structure-consistency` [Inicio+shell], `unavailable-modules` [6 vistas], `global-consistency` [7 áreas+Login, Polish]) | ✅ |
| SC-033 Transiciones/animaciones ≤ 150 ms; sin bucles | E15 · e2e (`visual-criteria` [Login+Inicio], `tokens`, `structure-consistency` [Inicio+shell], `unavailable-modules` [6 vistas], `global-consistency` [7 áreas+Login, Polish]) | ✅ |
| SC-034 `line-height` de contenido ≥ 1,4 | E15 · e2e (`visual-criteria` [Login+Inicio], `tokens`, `structure-consistency` [Inicio+shell], `unavailable-modules` [6 vistas], `global-consistency` [7 áreas+Login, Polish]) | ✅ |
| SC-035 h1 ≤ 2× cuerpo; huecos ≤ 1,5× ModuleHeader; hit-target ≥ 24×24 | E15 · e2e (`visual-criteria` [Login+Inicio, sin la comprobación de huecos], `structure-consistency` [Inicio+shell], `unavailable-modules` [6 vistas], `global-consistency` [7 áreas+Login, Polish]) | ✅ |
| SC-036 FR-027 (a)–(e) presentes de forma conjunta | E7 + E9 · e2e (`product-identity` [a–c, US2], `global-consistency` [d–e + 7 áreas, Polish]) + checklist | ✅ |
| SC-037 Login: nombre+símbolo, propósito, mismos componentes botón/error, sin adornos | E7 · e2e (`product-identity`) + checklist | ✅ |
| SC-038 (nombre,icono) única por área; sin entradas duplicadas; fuente única | E6 · e2e (`registry`, `primary-nav`) | ✅ |

Los SC marcados como «juicio» (SC-008, SC-010, SC-013) no bloquean la entrega pero
deben ejecutarse y registrarse; si fallan, generan tareas de refinamiento (US7 es
P3). Los SC de panel de personas (SC-006, SC-007, SC-009, SC-010, SC-013) siguen el
protocolo **normativo** de la spec §«Evaluación con personas», incluida su
**política de re-test** para los bloqueantes SC-006/SC-007/SC-009 (fallo de un
evaluador → corregir causa raíz en el producto y repetir con panel nuevo; máx. 2
re-tests; luego decisión documentada de la persona propietaria). SC-031…SC-038 son
criterios de verificación automatizable/estructural y bloquean como el resto de SC
no marcados «juicio».
