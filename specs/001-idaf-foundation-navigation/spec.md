# Feature Specification: Fundación funcional de IDAF (experiencia base y navegación)

**Feature Branch**: `001-idaf-foundation-navigation`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "SPEC 001 — Fundación funcional de IDAF. Crear la experiencia base de IDAF: pantalla de Inicio, siete áreas funcionales (Inicio, Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología, Observabilidad), navegación consistente entre ellas, y vistas de 'funcionalidad no disponible' para los seis módulos aún no implementados. Sin funcionalidades operacionales, sin autenticación, sin datos simulados de dispositivos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconocer qué es IDAF al ingresar (Priority: P1)

Un usuario técnico abre IDAF por primera vez y, al terminar la carga inicial, ve una
pantalla de Inicio que identifica el producto como **IDAF**, explica brevemente su
propósito (descubrimiento, gestión, diagnóstico y observabilidad de dispositivos de
red e IoT) y muestra la lista de las siete áreas principales con su estado de
disponibilidad.

**Why this priority**: Es el objetivo central de la spec y el único módulo que estará
funcionalmente disponible. Sin esta pantalla, IDAF no existe como producto reconocible
y ninguna otra historia aporta valor.

**Independent Test**: Abrir la aplicación y verificar que la pantalla de Inicio se
muestra, nombra a IDAF, describe su propósito y lista las siete áreas con su estado.
Entrega valor por sí sola: el usuario entiende qué es IDAF y qué tendrá.

**Acceptance Scenarios**:

1. **Given** que el usuario abre IDAF, **When** la aplicación finaliza su carga
   inicial, **Then** se muestra la pantalla de Inicio identificando el producto como
   IDAF.
2. **Given** que el usuario está en la pantalla de Inicio, **When** la observa,
   **Then** encuentra una explicación breve de que IDAF está orientado al
   descubrimiento, gestión, diagnóstico y observabilidad de dispositivos de red e IoT.
3. **Given** que el usuario está en la pantalla de Inicio, **When** la observa,
   **Then** ve las siete áreas (Inicio, Inventario, Descubrimiento, Conexiones,
   Diagnósticos, Topología, Observabilidad) con una indicación de estado
   ("Disponible" para Inicio, "No disponible" para las demás).

---

### User Story 2 - Navegar entre todas las áreas (Priority: P1)

Desde cualquier punto de la aplicación, el usuario usa la navegación principal visible
para desplazarse a cualquiera de las siete áreas, incluidas las seis aún no
implementadas, sin necesidad de recargar ni de pasar primero por Inicio.

**Why this priority**: La navegación consistente es el segundo pilar de la spec. Sin
ella, las áreas no son alcanzables y la "experiencia base navegable" no se cumple.

**Independent Test**: Con la navegación principal visible, seleccionar cada una de las
siete áreas y confirmar que la vista correspondiente se muestra; luego navegar
directamente de un módulo a otro sin volver a Inicio.

**Acceptance Scenarios**:

1. **Given** que el usuario está en cualquier área, **When** observa la interfaz,
   **Then** la navegación principal con las siete áreas permanece visible y utilizable.
2. **Given** que el usuario está viendo Topología, **When** selecciona Inventario,
   **Then** pasa a la sección Inventario sin regresar previamente a Inicio.
3. **Given** que el usuario se encuentra en cualquier módulo, **When** selecciona
   Inicio, **Then** regresa a la pantalla de Inicio sin recargar ni reiniciar la
   aplicación.
4. **Given** que el usuario está en un módulo, **When** selecciona repetidamente ese
   mismo módulo, **Then** no se producen errores ni contenido duplicado.
5. **Given** que el usuario está en `/topologia` (u otra ruta válida de un área),
   **When** recarga el navegador, **Then** permanece en esa misma área con la
   navegación principal visible y utilizable.

---

### User Story 3 - Entender que un módulo aún no está disponible (Priority: P2)

Al entrar a Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología u
Observabilidad, el usuario ve una vista propia de ese módulo, identificada con su
nombre, que indica de forma explícita que la funcionalidad todavía no está disponible
y se incorporará más adelante, sin botones ni acciones que aparenten operar.

**Why this priority**: Refuerza la honestidad del producto (constitución: nada debe
aparentar funcionar). Depende de que exista la navegación (P1), por eso es P2.

**Independent Test**: Entrar a cada uno de los seis módulos pendientes y verificar
que cada vista muestra el nombre del módulo, el mensaje de "no disponible" y ninguna
acción operativa falsa.

**Acceptance Scenarios**:

1. **Given** que el usuario está en Inicio, **When** selecciona Descubrimiento,
   **Then** ve la sección Descubrimiento con una indicación explícita de que todavía
   no está disponible y será incorporada en una próxima versión.
2. **Given** que el usuario entra a cualquiera de los seis módulos pendientes,
   **When** revisa la vista, **Then** no encuentra botones ni acciones (p. ej.
   "Ejecutar diagnóstico", "Analizar dispositivo", "Escanear red") que aparenten
   realizar una operación inexistente.
3. **Given** que el usuario está en un módulo pendiente, **When** observa la vista,
   **Then** la vista no está vacía, no muestra un error, no muestra información
   técnica interna y no muestra acciones falsas: muestra el mensaje de funcionalidad
   pendiente.

---

### Edge Cases

Referencia estable: **EC-01 … EC-06**. Estos nombres son canónicos y se usan sin
variación en `plan.md`, `research.md`, `tasks.md` y `contracts/`.

- **EC-01 — Selección repetida del módulo actual**: seleccionar varias veces el área
  en la que ya se está no debe producir errores ni duplicar contenido; la vista
  permanece estable (un solo encabezado de módulo en el DOM, consola sin errores).
- **EC-02 — Navegación rápida entre módulos**: alternar muchas veces y rápidamente
  (al menos 20 alternancias consecutivas) entre áreas debe dejar visible únicamente
  el módulo seleccionado en último lugar, sin estados intermedios "pegados" ni
  acumulación de vistas.
- **EC-03 — Módulo sin funcionalidad**: la ausencia de funcionalidad nunca se
  presenta como pantalla en blanco, error visible, volcado técnico o acción falsa;
  siempre como el mensaje de "funcionalidad no disponible".
- **EC-04 — Fallo al mostrar una sección**: si una sección no puede mostrarse
  correctamente, el usuario recibe un mensaje comprensible indicando que ocurrió un
  problema y ofreciendo volver a Inicio o reintentar; no se muestra únicamente un
  error técnico interno. "Reintentar" vuelve a intentar la ruta actual; si vuelve a
  fallar, permanece el mensaje de error y la opción de volver a Inicio.
- **EC-05 — Ruta / destino desconocido**: si el usuario llega a un destino que no
  corresponde a ninguna de las siete áreas, la aplicación lo redirige a Inicio, nunca
  un error crudo.
- **EC-06 — Recarga estando en un módulo**: recargar el navegador mientras se ve una
  ruta válida de un módulo debe dejar al usuario en ese mismo módulo (por ejemplo,
  `/topologia` → recarga → `/topologia`), con la navegación principal visible y
  utilizable; la navegación no queda rota. Inicio es el estado inicial únicamente
  cuando la aplicación se abre en la raíz `/`; una ruta desconocida sigue
  redirigiendo a Inicio (EC-05). Ver **FR-027**.

## Requirements *(mandatory)*

### Functional Requirements

#### Identidad y pantalla de Inicio

- **FR-001**: El sistema MUST mostrar una pantalla de Inicio al finalizar la carga
  inicial de la aplicación. Durante esa carga inicial el sistema MUST NOT mostrar
  errores técnicos ni contenido que aparente funcionalidad (ver Assumptions).
- **FR-002**: La pantalla de Inicio MUST identificar el producto con el nombre
  **IDAF** de forma visible.
- **FR-003**: La pantalla de Inicio MUST incluir una explicación breve del propósito
  de IDAF. Los conceptos obligatorios que debe mencionar son: **descubrimiento,
  gestión, diagnóstico y observabilidad**, referidos a **dispositivos de red e IoT**.
  "Breve" significa un texto corto (uno o dos párrafos); no se fija una longitud
  exacta y su ubicación es la propia pantalla de Inicio.
- **FR-004**: La pantalla de Inicio MUST dar acceso visible a las siete áreas
  principales mediante la navegación principal (presente también en Inicio) y MUST
  listar las siete áreas con su estado de disponibilidad. Las filas de esa lista son
  informativas (etiqueta + estado); la navegación entre áreas se realiza con la
  navegación principal (FR-008, FR-009).
- **FR-005**: La pantalla de Inicio MUST mostrar, para cada una de las siete áreas,
  su estado de disponibilidad usando exactamente una de las **dos etiquetas
  oficiales**: **"Disponible"** (solo Inicio) o **"No disponible"** (las otras seis).
  No se usan otras etiquetas; en particular, "Próximamente" no es una etiqueta válida.

#### Áreas y navegación

- **FR-006**: El sistema MUST ofrecer exactamente estas siete áreas principales, en
  este orden: Inicio, Inventario, Descubrimiento, Conexiones, Diagnósticos,
  Topología, Observabilidad.
- **FR-007**: Cada capacidad principal MUST aparecer una sola vez en la navegación,
  con una etiqueta única y consistente en toda la aplicación (sin sinónimos ni
  entradas duplicadas que representen la misma capacidad).
- **FR-008**: La navegación principal MUST permanecer visible y utilizable durante el
  uso normal de la aplicación, desde cualquier área. "Uso normal" abarca todas las
  rutas válidas de las siete áreas y la redirección desde una ruta desconocida
  (EC-05). En el estado de fallo de sección (EC-04): si el fallo ocurre dentro de la
  vista de un área, la navegación principal permanece disponible; si impidiera
  renderizar el marco completo, la vista de error igualmente ofrece "Volver a Inicio".
- **FR-009**: Los usuarios MUST poder seleccionar cada una de las siete áreas desde
  la navegación principal.
- **FR-010**: El sistema MUST permitir navegar directamente desde cualquier área a
  cualquier otra sin necesidad de pasar primero por Inicio.
- **FR-011**: El sistema MUST permitir regresar a Inicio desde cualquier área usando
  la navegación principal, sin recargar ni reiniciar manualmente la aplicación.
- **FR-012**: Al seleccionar un área, el sistema MUST mostrar una vista identificada
  con el nombre de esa área. Para Inicio, la identificación visible mediante el
  nombre de producto **"IDAF"** satisface este requisito.
- **FR-013**: Seleccionar repetidamente el área actualmente activa MUST NOT producir
  errores ni contenido duplicado. Verificable como: la consola del navegador no
  registra errores y el DOM contiene un solo encabezado de módulo.
- **FR-014**: Al alternar rápidamente entre áreas —entendido como **al menos 20
  alternancias consecutivas**— el sistema MUST mostrar únicamente la última área
  seleccionada y continuar respondiendo (una navegación posterior surte efecto), sin
  vistas acumuladas ni estados intermedios "pegados".

#### Módulos aún no disponibles

- **FR-015**: Cada uno de los seis módulos no implementados (Inventario,
  Descubrimiento, Conexiones, Diagnósticos, Topología, Observabilidad) MUST tener su
  propia vista accesible desde la navegación.
- **FR-016**: La vista de un módulo no implementado MUST indicar de forma explícita
  que la funcionalidad todavía no está disponible y que se incorporará en una versión
  posterior de IDAF.
- **FR-017**: La vista de un módulo no implementado MUST NOT mostrar botones,
  controles ni acciones que aparenten ejecutar una operación real (por ejemplo,
  "Ejecutar diagnóstico", "Iniciar descubrimiento", "Analizar dispositivo",
  "Escanear red"). Criterio de clasificación: se considera "acción aparente"
  cualquier control interactivo que sugiera iniciar, ejecutar, analizar, escanear,
  conectar, guardar o modificar algo. En la práctica, la vista solo contiene texto:
  sin `button`, `input`, `form`, `select` ni enlaces de acción.
- **FR-018**: La vista de un módulo no implementado MUST NOT presentarse como
  pantalla vacía, error visible o información técnica interna. Por "información
  técnica interna" se entiende: trazas de pila, mensajes de excepción, códigos de
  error internos, identificadores técnicos, cadenas de versión o build, y nombres de
  archivos o rutas del código.
- **FR-019**: El sistema MUST NOT mostrar datos que aparenten representar dispositivos
  reales o simulados en ninguna de las siete áreas (incluida Inicio). Esto prohíbe
  listados, tablas, fichas o valores que representen instancias de dispositivos
  (nombres de host, direcciones IP o MAC, estados de dispositivo, métricas). El texto
  descriptivo sobre qué hará cada área sí está permitido.

#### Manejo de errores y estados inesperados

- **FR-020**: Durante la navegación normal, el sistema MUST NOT mostrar errores
  técnicos, trazas ni mensajes internos al usuario (según la definición de
  "información técnica interna" de FR-018). Los detalles técnicos pueden registrarse
  fuera de la interfaz (por ejemplo, en la consola de desarrollo).
- **FR-021**: Si una sección no puede mostrarse correctamente, el sistema MUST
  mostrar un mensaje comprensible que indique que ocurrió un problema y ofrezca al
  usuario una salida. "Comprensible" significa: redactado para el usuario objetivo
  (perfil de redes/soporte), sin códigos ni jerga técnica, y acompañado de al menos
  una acción de salida. Las acciones son: **Reintentar** —vuelve a intentar mostrar
  la ruta actual; si vuelve a fallar, permanece el mensaje de error— y **Volver a
  Inicio** —siempre disponible—.
- **FR-022**: Si el usuario alcanza un destino que no corresponde a ninguna de las
  siete áreas, el sistema MUST redirigirlo a Inicio, sin mostrar errores crudos ni
  trazas y sin una vista intermedia de "no encontrado".

#### Alcance y consistencia

- **FR-023**: El sistema MUST NOT requerir autenticación, inicio de sesión ni
  gestión de usuarios o roles para navegar por la aplicación.
- **FR-024**: El usuario MUST poder navegar por toda la aplicación sin usar consola,
  editar archivos ni tener conocimientos de desarrollo de software.
- **FR-025**: La terminología visible de las siete áreas MUST ser idéntica en la
  pantalla de Inicio y en la navegación principal.
- **FR-026**: El sistema MUST NOT incluir funcionalidades operacionales de los
  módulos futuros (creación/administración de dispositivos, escaneo de red,
  conexiones, ejecución de comandos, diagnósticos, topología, telemetría, IA, etc.).

#### Recarga y acceso directo a rutas

- **FR-027**: Una recarga del navegador —o el acceso directo mediante URL— sobre una
  ruta válida de un área MUST conservar el área correspondiente (por ejemplo,
  `/topologia` → recarga → `/topologia`) y MUST mantener la navegación principal
  visible y utilizable. Inicio se muestra como estado inicial únicamente cuando la
  aplicación se abre en la raíz `/`. Una ruta desconocida sigue el comportamiento de
  FR-022 (redirección a Inicio). La ruta actual vive en la URL y no constituye estado
  persistido por la aplicación, por lo que este requisito no contradice la ausencia
  de persistencia (ver Assumptions).

#### Accesibilidad de la navegación

- **FR-028**: La navegación principal MUST poder utilizarse por completo mediante
  teclado: el foco puede alcanzar cada una de las siete entradas y activarlas sin
  usar el ratón.
- **FR-029**: El área actualmente activa MUST señalarse de forma perceptible en la
  navegación principal, con una indicación visible y también expuesta a tecnologías
  de asistencia.
- **FR-030**: Cada entrada de la navegación principal MUST exponer un nombre
  comprensible para tecnologías de asistencia (lectores de pantalla), coincidente con
  su etiqueta visible.
- **FR-031**: El indicador de foco del teclado MUST ser visible mientras el usuario
  recorre la navegación principal.

### Key Entities

- **Área funcional (módulo)**: unidad principal de navegación de IDAF. Atributos:
  nombre visible (único), orden de aparición, estado de disponibilidad
  ("disponible" | "no disponible"). Conjunto fijo de siete en esta spec.
- **Estado de disponibilidad**: valor asociado a cada área que comunica al usuario si
  puede usarse ("Disponible") o no ("No disponible"). Estas dos son las **únicas
  etiquetas oficiales**. En esta spec: solo Inicio es "Disponible".

## Success Criteria *(mandatory)*

En estos criterios, **"un solo paso de navegación"** significa una única activación de
un control de la navegación principal, sin pantallas intermedias y sin pasar por
Inicio. Una **"alternancia"** es una navegación de un área a otra distinta.

Los criterios se clasifican en **obligatorios** (bloquean la aceptación de la SPEC
001) y **validaciones de usabilidad no bloqueantes** (dependen de juicio humano; un
resultado deficiente se registra como retroalimentación y no bloquea por sí solo la
aceptación, dado que Assumptions permite ajustar el texto exacto sin cambiar su
significado).

### Criterios obligatorios (bloqueantes)

- **SC-001**: El 100 % de las siete áreas (Inicio, Inventario, Descubrimiento,
  Conexiones, Diagnósticos, Topología, Observabilidad) aparecen en la navegación,
  una sola vez cada una y en el orden definido.
- **SC-002**: Desde cualquier área, un usuario puede llegar a cualquier otra de las
  siete áreas en un solo paso de navegación (sin pasar por Inicio).
- **SC-003**: Desde cualquier área, un usuario puede volver a Inicio en un solo paso
  de navegación, sin recargar la aplicación.
- **SC-004**: Los seis módulos no implementados muestran, cada uno, un mensaje
  explícito de "funcionalidad no disponible" y cero acciones operativas visibles.
- **SC-006 (verificación automatizada)**: En una sesión automatizada que recorra las
  siete áreas y realice al menos 20 alternancias, no se produce ningún error técnico,
  pantalla vacía ni contenido duplicado, y la consola del navegador no registra
  errores.
- **SC-007**: Seleccionar el área activa 10 veces seguidas no genera errores ni
  duplica contenido (consola sin errores; un solo encabezado de módulo en el DOM).
- **SC-008**: Los 12 criterios de aceptación CA-01 … CA-12, definidos en la sección
  "Criterios de aceptación (CA-01 … CA-12)" de este documento, se responden todos con
  "Sí" usando la aplicación.

### Validaciones de usabilidad no bloqueantes

- **SC-005 (no bloqueante)**: Un usuario técnico con perfil de redes/soporte que
  nunca ha usado IDAF, tras abrir la aplicación y usarla durante **menos de 3
  minutos**, puede responder correctamente las cinco preguntas siguientes:
  1. ¿Qué es IDAF?
  2. ¿Para qué sirve?
  3. ¿Cuáles serán sus capacidades principales?
  4. ¿Cuáles están disponibles actualmente?
  5. ¿Dónde puede encontrar cada una?

  Se considera satisfactoria si responde correctamente **las cinco**. Un resultado
  deficiente se registra como retroalimentación de redacción sobre los textos de la
  pantalla de Inicio y no bloquea por sí solo la aceptación de la SPEC 001.
- **Observación manual prolongada (asociada a SC-006, no bloqueante)**: En una sesión
  manual larga, con las herramientas de desarrollo abiertas, recorriendo las siete
  áreas y alternando entre ellas al menos 20 veces, no se observa ningún error
  técnico visible, pantalla en blanco ni contenido duplicado, y la consola permanece
  sin errores. Complementa —no sustituye— la verificación automatizada de SC-006.

## Criterios de aceptación (CA-01 … CA-12)

Estos doce criterios se incorporan al documento para que la especificación sea
**autosuficiente**; SC-008 depende de ellos y no de ningún documento externo. Cada
uno se responde "Sí" / "No" usando la aplicación.

| # | Criterio |
|---|----------|
| CA-01 | Al abrir la aplicación aparece la pantalla de Inicio identificando el producto como IDAF. |
| CA-02 | Inicio explica el propósito de IDAF (descubrimiento, gestión, diagnóstico y observabilidad de dispositivos de red e IoT). |
| CA-03 | Inicio lista las siete áreas con su estado de disponibilidad. |
| CA-04 | La navegación principal con las siete áreas está visible y es utilizable desde cualquier área. |
| CA-05 | Se puede ir de un módulo a otro sin pasar por Inicio. |
| CA-06 | Se puede volver a Inicio desde cualquier módulo sin recargar la aplicación. |
| CA-07 | Cada módulo pendiente tiene una vista propia identificada con su nombre. |
| CA-08 | Cada módulo pendiente indica explícitamente que su funcionalidad todavía no está disponible y se incorporará más adelante. |
| CA-09 | Ningún módulo pendiente muestra acciones falsas ni datos que aparenten dispositivos. |
| CA-10 | Reseleccionar el área activa no genera errores ni contenido duplicado. |
| CA-11 | Alternar rápidamente entre áreas deja visible solo la última, sin estados intermedios "pegados". |
| CA-12 | Un destino desconocido no produce un error crudo; la aplicación redirige a Inicio. |

## Assumptions

- El usuario objetivo tiene conocimientos básicos o intermedios de redes/soporte
  técnico, pero no de programación, bases de datos ni arquitectura de software.
- Toda la interfaz de usuario de esta spec se presenta **en español**; no hay
  internacionalización ni selección de idioma en el alcance.
- La aplicación se usa en un entorno de escritorio/navegador estándar; el diseño
  responsive y el soporte de viewports móviles o táctiles están fuera del alcance
  (ver Out of Scope).
- La carga inicial de la aplicación es prácticamente instantánea (artefacto
  estático); no se especifica ni se requiere una pantalla de carga intermedia, y
  durante ella no se muestran errores técnicos ni contenido que aparente
  funcionalidad (FR-001, FR-018, FR-020).
- "Vista propia" de un módulo pendiente significa una pantalla identificable con el
  nombre del módulo y el mensaje de pendiente; no implica ninguna estructura interna
  adicional.
- El texto exacto de los mensajes (propósito de IDAF, "funcionalidad no disponible")
  puede ajustarse siempre que comunique la misma información sin ambigüedad y se
  conserve lo verificable exigido por FR-002 (nombre "IDAF"), FR-003 (los cuatro
  conceptos y "red e IoT") y FR-016 (mención explícita de "no disponible" y de
  incorporación futura).
- No hay persistencia de estado de usuario ni preferencias en esta spec (sin
  `localStorage`, cookies ni almacenamiento equivalente). "Apertura de la
  aplicación" significa acceder a la raíz `/`, que siempre muestra Inicio; no se
  recuerda la última área visitada entre sesiones. Esto no contradice FR-027: una
  recarga o un acceso directo a la URL de un módulo conserva ese módulo porque la
  ruta actual vive en la URL, no en estado persistido por la aplicación.
- La lista de las siete áreas y sus estados de disponibilidad son constantes
  definidas en el producto para esta versión (solo Inicio disponible); no provienen
  de ninguna fuente en tiempo de ejecución, no se configuran por el usuario y no
  existe un estado "sin datos" para esa lista.
- No existen sistemas externos, APIs ni fuentes de datos a integrar en esta spec.

## Out of Scope

Esta spec **no** incluye (cada capacidad se abordará en specs independientes):

- Creación, administración, almacenamiento o inventario funcional de dispositivos.
- Descubrimiento / escaneo de red y detección automática de dispositivos.
- Conexiones a dispositivos, SSH, manejo de credenciales, ejecución de comandos.
- Diagnósticos (incluidos diagnósticos paralelos).
- Topología de red y generación de relaciones entre dispositivos.
- Telemetría y métricas de dispositivos.
- OpenWrt, OpenThread, redes Mesh.
- Inteligencia artificial.
- Gestión de usuarios, autenticación, permisos o roles.
- Cualquier dato simulado que aparente representar dispositivos reales.
- Diseño responsive y soporte de viewports móviles o táctiles.
- Conformidad completa con WCAG y auditoría de accesibilidad; el alcance de
  accesibilidad se limita a los mínimos de FR-028 … FR-031 (teclado, foco visible,
  nombres accesibles y área activa perceptible).
