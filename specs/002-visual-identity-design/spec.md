# Feature Specification: Experiencia visual, navegación y acceso de usuario de IDAF

**Feature Branch**: `002-visual-identity-design`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "SPEC 002 — Experiencia visual, navegación y acceso de usuario de IDAF. IDAF ya cuenta con una estructura funcional básica de navegación entre sus siete áreas. Antes de incorporar lógica de descubrimiento, observabilidad y diagnóstico IoT, completar la experiencia general de uso: experiencia visual definitiva, acceso mediante autenticación (usuario + contraseña), identificación del usuario dentro de la sesión, navegación más clara mediante etiquetas e iconos, y cierre de sesión explícito. Las futuras funcionalidades deben poder incorporarse dentro de una estructura visual estable sin rediseñar el comportamiento general. Login obligatorio; credenciales inválidas → mensaje genérico; ruta protegida sin sesión → Login; logout → Login; siete áreas fijas con nombre + icono; solo una activa; seis módulos siguen 'No disponible'. La tecnología de implementación (incluido el mecanismo de autenticación) corresponde al plan."

## Clarifications

### Session 2026-09-07

- Q: Al cerrar la pestaña o el navegador sin cerrar sesión, ¿la sesión sigue activa? → A: No; la sesión sobrevive solo a la recarga de página. Cerrar la pestaña o el navegador finaliza la sesión y la siguiente visita muestra el acceso.
- Q: ¿Existe ya un logotipo/símbolo de IDAF para reutilizar o debe crearse en esta feature? → A: Se crea en esta feature un símbolo original y sencillo; no hay recurso de marca previo.
- Q: ¿Hasta dónde llega la accesibilidad además del foco de teclado visible y el contraste AA? → A: Además, operabilidad completa por teclado de todos los elementos interactivos, nombres/roles accesibles en los controles, landmarks para las zonas principales y gestión razonable del foco al iniciar y cerrar sesión.
- Q: ¿El conjunto de credenciales válidas es una única cuenta compartida o varias cuentas distintas? → A: Varias cuentas distintas predefinidas; cada una con su propia contraseña y su propio nombre/identificador mostrado, y todas con la misma experiencia.
- Q: Con sesión activa, ¿qué muestra IDAF al abrir una ruta que no corresponde a ninguna de las siete áreas? → A: Redirige a Inicio, sin mostrar ningún error.

### Session 2026-09-08

- Q: ¿Qué ocurre si la verificación de credenciales no puede completarse por una causa distinta de credenciales inválidas (el mecanismo de autenticación no responde)? → A: No se inicia sesión ni se crea sesión; se permanece en el acceso con un mensaje que distingue «no se pudo verificar el acceso, inténtalo de nuevo» del mensaje de «usuario o contraseña incorrectos» (FR-056, SC-027).
- Q: Con una sesión activa, ¿qué muestra IDAF al abrir la pantalla de acceso? → A: Redirige a Inicio; no muestra un segundo formulario de acceso ni cierra la sesión activa (FR-057, SC-028).
- Q: Con varias pestañas o ventanas abiertas sobre la misma sesión, si el usuario cierra sesión en una, ¿qué pasa con las demás? → A: Dejan de permitir el uso de las áreas internas a más tardar al recargar, al volver a la pestaña o al intentar una operación que requiera la sesión; muestran el acceso. No se exige propagación en tiempo real mientras una pestaña permanece en segundo plano (FR-058, SC-029).
- Q: ¿Dónde se coloca el foco cuando el inicio de sesión falla? → A: En el mensaje de error, o permanece en el formulario de acceso, de modo que el resultado sea perceptible sin depender del color (FR-054, SC-022).
- Q: ¿Qué muestra la pantalla de Inicio en esta spec? → A: Lo mismo que en la SPEC 001 —identidad del producto, explicación breve y vista general de las siete áreas con su estado de disponibilidad—, ahora con la identidad visual definitiva y el encabezado de módulo consistente, y sin datos operacionales ni métricas (FR-059, SC-030).
- Q: ¿Cómo se verifican los criterios que dependen de personas (SC-006, SC-007, SC-009, SC-010, SC-013)? → A: Con un panel de al menos 5 evaluadores de perfil técnico ajenos al diseño, en tareas individuales sin ver la URL; se conservan los umbrales indicados en cada criterio (ver «Evaluación con personas»).
- Q: Los términos visuales subjetivos («sobrio», «densidad moderada», «cambio leve de color», «evolución perceptible»), ¿cómo se hacen verificables? → A: Se añaden criterios objetivos a FR-021, FR-027, FR-029, FR-030 y FR-042.
- Q: El requisito de contraste de FR-040, ¿es el mismo que el de SC-016? → A: Sí; FR-040 se ancla explícitamente a WCAG 2.1 AA (4,5:1 texto normal; 3:1 texto grande y componentes).
- Q: ¿Prohíbe la spec de forma explícita exponer secretos, contraseñas, hashes o verificadores de credenciales en el frontend y el repositorio? → A: Sí; se añaden FR-055 y SC-025/SC-026.
- Q: Los términos objetivados (FR-021, FR-027, FR-029, FR-030, FR-042) y la evaluación humana, ¿tienen criterios de éxito completos y verificables? → A: Se añaden SC-031…SC-038 (FR-021→SC-031; FR-030→SC-032/SC-033/SC-034; FR-042→SC-035 y SC-034; FR-027→SC-036; FR-029→SC-037; FR-025→SC-038). SC-019 fija un umbral objetivo de «divergencia». La sección «Evaluación con personas» se detalla con cribado del panel (incl. sin exposición previa a SPEC 001/002 para SC-006/SC-007), preguntas literales y neutrales, rúbrica objetiva de SC-007 (definición de «herramienta técnica de redes/IoT/diagnóstico» y de «plantilla administrativa genérica»), definición observable de «expresa duda» (SC-009), material mostrado (Login + Inicio + Topología), medición de tiempos con evento de inicio/fin e instrumento (SC-002, SC-008, SC-010) y política de re-test de criterios bloqueantes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceder a IDAF mediante inicio de sesión (Priority: P1)

Una persona técnica abre IDAF. Si no tiene una sesión activa, ve la pantalla de
inicio de sesión, que identifica el producto como IDAF y explica brevemente su
propósito. Ingresa usuario y contraseña; con credenciales válidas entra a la pantalla
de Inicio con la navegación disponible; con credenciales inválidas permanece en la
pantalla de acceso y recibe un mensaje comprensible y genérico.

**Why this priority**: El acceso controlado es la puerta de entrada de la
aplicación. Sin él no hay sesión, no hay identificación de usuario ni cierre de
sesión, y el resto de la experiencia no puede ejercitarse.

**Independent Test**: Abrir IDAF sin sesión y comprobar que aparece Login; iniciar
sesión con credenciales válidas y verificar el acceso a Inicio; repetir con
credenciales inválidas y con campos vacíos y verificar que no se accede y que el
mensaje no indica cuál campo falló.

**Acceptance Scenarios**:

1. **Given** que el usuario no tiene sesión activa, **When** abre IDAF, **Then** se
   muestra la pantalla de inicio de sesión y ninguna de las siete áreas internas es
   visible ni accesible.
2. **Given** la pantalla de inicio de sesión, **When** el usuario la observa,
   **Then** contiene el nombre IDAF, una explicación breve de su propósito, un campo
   de usuario, un campo de contraseña y una acción visible para iniciar sesión.
3. **Given** que el usuario introduce credenciales válidas, **When** confirma el
   inicio de sesión, **Then** se inicia una sesión y accede a la pantalla de Inicio
   con la navegación principal disponible.
4. **Given** que el usuario introduce credenciales no válidas, **When** confirma el
   inicio de sesión, **Then** no accede a la aplicación, permanece en la pantalla de
   acceso y recibe un mensaje comprensible del tipo «Usuario o contraseña
   incorrectos.», que no revela si falló el usuario o la contraseña.
5. **Given** que el usuario deja vacío el usuario o la contraseña, **When** intenta
   iniciar sesión, **Then** no se inicia sesión y recibe una indicación
   comprensible.
6. **Given** que el usuario realiza varios intentos incorrectos consecutivos,
   **When** vuelve a intentarlo, **Then** no se producen errores ni se concede
   acceso (esta spec no implementa bloqueo de cuenta).
7. **Given** que la verificación de credenciales no puede completarse por una causa
   distinta de credenciales inválidas (el mecanismo de autenticación no responde),
   **When** el usuario intenta iniciar sesión, **Then** no se inicia sesión ni se
   crea sesión, permanece en la pantalla de acceso y recibe un mensaje comprensible
   que indica que el acceso no se pudo verificar y que lo intente de nuevo,
   distinto del mensaje de credenciales incorrectas.
8. **Given** una sesión activa, **When** el usuario abre la pantalla de acceso,
   **Then** IDAF lo lleva a la pantalla de Inicio, sin mostrar un segundo
   formulario de acceso y sin cerrar la sesión activa.
9. **Given** que el inicio de sesión falla (credenciales inválidas o verificación
   no disponible), **When** se muestra el mensaje de error, **Then** el foco se
   mueve al mensaje o permanece en el formulario de acceso, y el resultado es
   perceptible sin depender del color.

---

### User Story 2 - Reconocer el producto y recibir una experiencia visual definitiva (Priority: P1)

En la pantalla de acceso y dentro de la aplicación, la persona identifica de
inmediato el producto como **IDAF** (nombre visible acompañado de un símbolo
relacionado con redes/nodos/conectividad) y percibe una herramienta técnica de
diagnóstico y observabilidad de infraestructura de red e IoT, no una plantilla
administrativa genérica ni un prototipo sin terminar. Login y aplicación interna se
reconocen como el mismo producto.

**Why this priority**: La spec debe establecer la experiencia visual definitiva; sin
una identidad coherente entre acceso y aplicación, IDAF no se percibe como un
producto único y estable sobre el que construir.

**Independent Test**: Mostrar la pantalla de acceso y una vista interna a
evaluadores sin dejar ver la URL, y confirmar que nombran el producto como IDAF, lo
describen como plataforma técnica de redes/IoT/diagnóstico y reconocen ambas
pantallas como el mismo producto.

**Acceptance Scenarios**:

1. **Given** la pantalla de acceso, **When** una persona la observa sin ver la URL,
   **Then** identifica el producto como IDAF y reconoce que accede a una plataforma
   técnica de diagnóstico y observabilidad IoT.
2. **Given** cualquier módulo de la aplicación interna, **When** una persona lo
   observa sin ver la URL, **Then** identifica el producto como IDAF.
3. **Given** el nombre IDAF, **When** aparece en el acceso y en la estructura
   principal, **Then** va acompañado de un símbolo/logotipo conceptualmente asociado
   a redes, nodos, conectividad, IoT, diagnóstico u observabilidad, sin que el
   símbolo reemplace al nombre.
4. **Given** la pantalla de acceso y la aplicación interna, **When** se comparan,
   **Then** comparten identidad, tipografía, paleta, iconografía, tratamiento de
   controles y comportamiento de navegación, y se reconocen como el mismo producto.
5. **Given** la aplicación resultante, **When** se compara con el prototipo de la
   SPEC 001, **Then** se percibe una evolución clara desde «prototipo navegable»
   hacia «aplicación técnica de diagnóstico y observabilidad IoT», no solo estilos
   básicos aplicados.

---

### User Story 3 - Navegar por las siete áreas con nombre, icono y estado activo inequívoco (Priority: P1)

La persona autenticada ve la navegación con exactamente siete áreas (Inicio,
Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología, Observabilidad).
Cada entrada muestra un nombre visible y un icono distinguible de una misma familia
visual; el icono complementa al texto y no lo reemplaza. En todo momento la persona
sabe en qué área se encuentra, y solo una aparece activa.

**Why this priority**: La navegación es el recorrido principal de la aplicación
autenticada; una iconografía inconsistente, un estado activo ambiguo o varias áreas
activas rompen la experiencia y el uso intuitivo.

**Independent Test**: Estando autenticado, recorrer las siete áreas y comprobar que
cada una muestra nombre e icono, que los siete iconos pertenecen al mismo lenguaje
visual y evocan el concepto de su área, y que siempre hay exactamente una marcada
como activa; alternar rápidamente entre módulos y verificar que no hay más de uno
activo ni contenido duplicado.

**Acceptance Scenarios**:

1. **Given** que el usuario está autenticado, **When** observa la navegación,
   **Then** ve las siete áreas, cada una con un nombre visible y un icono
   distinguible.
2. **Given** cualquier entrada de navegación, **When** se revisa, **Then** el icono
   acompaña al texto y el nombre permanece visible junto al icono.
3. **Given** los siete iconos, **When** se comparan, **Then** pertenecen a un único
   lenguaje visual y cada uno representa de forma reconocible el concepto de su área
   (Inicio→inicio/panel; Inventario→dispositivos/listado; Descubrimiento→búsqueda/
   exploración; Conexiones→enlace/conexión; Diagnósticos→análisis/diagnóstico;
   Topología→red/relaciones; Observabilidad→métricas/monitoreo).
4. **Given** que el usuario selecciona un área (p. ej. Topología), **When** la vista
   se muestra, **Then** esa área queda identificada como activa mediante al menos
   dos señales visuales simultáneas y no solo por un cambio leve de color.
5. **Given** cualquier momento de uso, **When** se revisa la navegación, **Then**
   exactamente una de las siete áreas aparece activa.
6. **Given** que el usuario alterna rápidamente entre módulos, **When** cambia de
   uno a otro, **Then** no se muestra más de un módulo activo ni se duplica
   contenido.
7. **Given** que un icono no puede mostrarse, **When** la navegación se renderiza,
   **Then** el nombre textual del módulo permite seguir identificándolo y usándolo.

---

### User Story 4 - Identificar la sesión activa y cerrar sesión de forma explícita (Priority: P2)

Mientras la sesión está activa, la persona ve una indicación visible de sesión y una
identificación comprensible del usuario autenticado (su nombre o identificador).
Existe una acción visible y fácilmente identificable para cerrar sesión, disponible
desde cualquiera de las siete áreas. Al cerrar sesión, la sesión termina y la persona
vuelve a la pantalla de acceso; las áreas internas dejan de ser accesibles.

**Why this priority**: Cerrar la sesión de forma explícita y controlada completa el
ciclo de acceso. Depende de que exista el inicio de sesión (P1).

**Independent Test**: Autenticarse; localizar la identificación del usuario y la
acción de cerrar sesión desde varias áreas; cerrar sesión y comprobar el regreso a
Login; intentar volver a una ruta interna y comprobar que se muestra Login.

**Acceptance Scenarios**:

1. **Given** una sesión activa, **When** el usuario observa la interfaz, **Then**
   encuentra una indicación visible de sesión activa y su nombre o identificador.
2. **Given** cualquiera de las siete áreas, **When** el usuario busca la salida,
   **Then** encuentra una acción visible y fácilmente identificable para cerrar
   sesión.
3. **Given** que el usuario cierra sesión, **When** la acción se completa, **Then**
   la sesión finaliza, regresa a la pantalla de acceso y las áreas internas dejan de
   ser accesibles con una sesión válida.
4. **Given** que el usuario ha cerrado sesión, **When** intenta acceder de nuevo a
   una sección protegida, **Then** IDAF lo lleva a la pantalla de acceso.
5. **Given** la identificación del usuario y la acción de cerrar sesión, **When** se
   comparan con la navegación entre módulos y con los controles del módulo,
   **Then** se presentan agrupadas como elementos de sesión y cerrar sesión no puede
   confundirse con una acción propia del módulo actual.
6. **Given** varias pestañas o ventanas de IDAF abiertas sobre la misma sesión,
   **When** el usuario cierra sesión en una de ellas, **Then** las demás dejan de
   permitir el uso de las áreas internas y muestran la pantalla de acceso a más
   tardar al recargar, al volver a la pestaña o al intentar una operación que
   requiera la sesión.

---

### User Story 5 - Encontrar una estructura y jerarquía visual consistentes en todas las áreas (Priority: P2)

Tras autenticarse, la persona encuentra la misma estructura en todas las áreas:
navegación principal, identificación del producto, identificación del usuario, acción
de cierre de sesión, área principal de contenido e indicación del módulo activo. Cada
vista permite distinguir el nombre del módulo, su contenido principal, la navegación
global y las acciones de sesión. Las siete áreas comparten tipografía, espaciado,
estilos de títulos, iconografía, estados activos, mensajes de error y botones.

**Why this priority**: Una estructura estable y consistente es lo que permite que las
próximas specs incorporen lógica sin rediseñar la aplicación. Depende de la
navegación (P1).

**Independent Test**: Recorrer las siete áreas y verificar que las zonas
(navegación, identidad, sesión, contenido) se distinguen y mantienen su posición y
tratamiento; comparar tipografía, títulos, botones, estados y mensajes de error entre
módulos y confirmar que son coherentes.

**Acceptance Scenarios**:

1. **Given** cualquier vista interna, **When** la persona la observa, **Then**
   distingue como zonas separadas la navegación principal, la identificación del
   producto, el contexto de sesión y el área principal de contenido, con indicación
   del módulo activo.
2. **Given** que la persona cambia de un módulo a otro, **When** la vista se
   actualiza, **Then** la estructura general y el tratamiento de sus zonas
   permanecen estables y reconocibles.
3. **Given** cualquier módulo, **When** se muestra, **Then** comienza con un
   encabezado consistente que indica el nombre del módulo y, cuando aporta claridad,
   una descripción breve de su propósito.
4. **Given** las siete áreas, **When** se comparan, **Then** comparten tipografía,
   espaciado, estilos de títulos, comportamiento de navegación, iconografía, estados
   activos, mensajes de error, botones y estructura general, y ninguna aparenta
   pertenecer a otra aplicación.
5. **Given** la paleta de la aplicación, **When** se inspecciona, **Then** define un
   color principal de identidad, colores neutros para fondos/superficies/texto y un
   conjunto de colores semánticos de estado con significado consistente entre
   módulos.
6. **Given** cualquier estado comunicado en la interfaz, **When** se elimina la
   percepción del color, **Then** el estado sigue siendo identificable por otra
   señal (texto, icono, forma o patrón).
7. **Given** un elemento interactivo, **When** se recorre su uso, **Then** se
   distinguen sus estados normal, seleccionado, foco de teclado, deshabilitado y
   error cuando corresponda, y un elemento deshabilitado no aparenta estar
   disponible.
8. **Given** el área principal de contenido, **When** se evalúa el reparto del
   espacio, **Then** es la región de mayor superficie y está preparada para alojar
   tablas, métricas, tarjetas, gráficas, alertas, topologías y resultados de
   diagnóstico en el futuro sin rediseñar la estructura global, sin mostrar en esta
   spec datos ni métricas ficticias.

---

### User Story 6 - Ver los módulos pendientes sin que aparenten estar disponibles (Priority: P2)

Al entrar a Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología u
Observabilidad, la persona ve una vista que conserva la identidad de IDAF y explica
que la funcionalidad aún no está disponible, sin gráficas, dispositivos, métricas ni
botones falsos. La mejora visual no hace que una funcionalidad inexistente aparente
operar.

**Why this priority**: Mantiene la honestidad del producto y la coherencia visual en
las seis vistas pendientes. Depende de la estructura y la navegación (P1).

**Independent Test**: Entrar a cada una de las seis vistas pendientes y comprobar que
mantienen la identidad visual y contienen icono del módulo, nombre, estado «No
disponible» y una explicación breve de incorporación futura, sin elementos
simulados.

**Acceptance Scenarios**:

1. **Given** cualquiera de los seis módulos pendientes, **When** la persona lo abre,
   **Then** la vista conserva la identidad visual de IDAF y no se muestra como una
   página vacía.
2. **Given** una vista de módulo no disponible, **When** se revisa, **Then** incluye
   el icono del módulo, su nombre, el estado «No disponible» y una explicación breve
   de que la funcionalidad se incorporará posteriormente.
3. **Given** una vista de módulo no disponible, **When** se revisa, **Then** no
   contiene gráficas, dispositivos, métricas ni botones que aparenten realizar una
   operación.

---

### User Story 7 - Mantener acceso y navegación robustos en casos límite (Priority: P3)

La persona usa IDAF en condiciones no ideales: recarga páginas, alterna módulos
rápidamente, tiene un identificador de usuario largo, recibe un mensaje de error
extenso o reduce el ancho de la ventana de escritorio. En todos los casos la
aplicación sigue siendo usable y su estructura no se rompe, con una densidad de
información moderada apta para sesiones prolongadas.

**Why this priority**: Refuerza la solidez de la experiencia sin cambiar la identidad
ni la estructura; es refinamiento sobre las historias anteriores.

**Independent Test**: Recargar rutas con y sin sesión; alternar módulos rápidamente;
probar un identificador de usuario largo y un mensaje de error extenso; reducir el
ancho de la ventana y verificar que navegación, sesión y cierre de sesión siguen
accesibles.

**Acceptance Scenarios**:

1. **Given** una sesión activa, **When** el usuario recarga una ruta interna válida,
   **Then** conserva el acceso y permanece en esa misma sección.
2. **Given** que no hay sesión, **When** el usuario recarga una ruta protegida,
   **Then** se muestra la pantalla de acceso.
3. **Given** un nombre o identificador de usuario más largo de lo habitual, **When**
   se muestra en el contexto de sesión, **Then** no rompe la estructura principal
   (se ajusta o trunca de forma definida) y la navegación y el contenido permanecen
   utilizables.
4. **Given** un mensaje de error más extenso de lo habitual, **When** se muestra,
   **Then** no se superpone a otros controles ni vuelve inutilizable la vista.
5. **Given** una ventana de escritorio de tamaño reducido (dentro del rango
   soportado), **When** el usuario la usa, **Then** la navegación, la identificación
   de sesión y la acción de cerrar sesión permanecen visibles y utilizables.
6. **Given** cualquier vista, **When** se evalúa su densidad, **Then** no presenta
   espacios excesivamente grandes sin propósito, títulos sobredimensionados ni
   decoración que reduzca el área útil, y tampoco resulta excesivamente compacta.

### Edge Cases

- **CL-01 — Campos vacíos**: iniciar sesión sin usuario o sin contraseña no inicia
  sesión y produce una indicación comprensible.
- **CL-02 — Credenciales incorrectas repetidas**: varios intentos incorrectos
  consecutivos no provocan errores ni conceden acceso. No hay bloqueo de cuenta en
  esta spec.
- **CL-03 — Recarga con sesión activa**: recargar una ruta válida con sesión
  conserva el acceso y mantiene al usuario dentro de la aplicación en esa sección.
- **CL-04 — Recarga sin sesión**: recargar una ruta protegida sin sesión muestra la
  pantalla de acceso.
- **CL-05 — Logout desde cualquier módulo**: cerrar sesión funciona desde cualquiera
  de las siete áreas.
- **CL-06 — Navegación rápida**: alternar rápidamente entre módulos no muestra más de
  un módulo activo ni duplica contenido.
- **CL-07 — Icono no disponible**: si un icono no puede mostrarse, el nombre textual
  del módulo sigue permitiendo identificar y utilizar la navegación.
- **CL-V01 — Texto largo**: un identificador de usuario que ocupa más espacio de lo
  habitual no rompe la estructura principal.
- **CL-V04 — Mensaje de error largo**: un mensaje de error extenso no se superpone a
  otros controles ni inutiliza la vista.
- **Acceso directo sin sesión**: escribir o abrir directamente una ruta interna sin
  sesión conduce a la pantalla de acceso, no a la sección solicitada.
- **CL-08 — Cierre del navegador**: cerrar la pestaña o el navegador sin cerrar
  sesión finaliza la sesión; al volver a abrir IDAF se muestra la pantalla de acceso.
- **Ruta desconocida con sesión**: con una sesión activa, abrir una ruta que no
  corresponde a ninguna de las siete áreas redirige a Inicio, sin mostrar un error.
- **Identidad sin color**: en percepción de color reducida, los estados semánticos y
  el módulo activo siguen distinguiéndose por señales no cromáticas.
- **CL-09 — Verificación de acceso no disponible**: si la verificación de
  credenciales no puede completarse (el mecanismo de autenticación no responde),
  no se inicia sesión, se permanece en el acceso y el mensaje mostrado es distinto
  del de credenciales incorrectas.
- **CL-10 — Acceso con sesión activa**: abrir la pantalla de acceso con una sesión
  válida redirige a Inicio sin cerrar la sesión y sin mostrar un segundo
  formulario.
- **CL-11 — Cierre de sesión con varias pestañas**: tras cerrar sesión en una
  pestaña, las demás pestañas sobre la misma sesión muestran el acceso a más tardar
  al recargar, al reactivarse o al intentar una operación que requiera la sesión.

## Requirements *(mandatory)*

### Functional Requirements

**Acceso y autenticación**

- **FR-001**: Al abrir IDAF sin una sesión válida, DEBE mostrarse la pantalla de
  inicio de sesión; el contenido interno (las siete áreas) NO DEBE ser visible ni
  accesible sin sesión válida.
- **FR-002**: La pantalla de inicio de sesión DEBE contener, como mínimo: el nombre
  IDAF, una explicación breve de su propósito, un campo de usuario, un campo de
  contraseña y una acción visible para iniciar sesión.
- **FR-003**: Con credenciales válidas, IDAF DEBE iniciar una sesión y llevar al
  usuario a la pantalla de Inicio con la navegación principal disponible.
- **FR-004**: Con credenciales no válidas, IDAF NO DEBE iniciar sesión ni conceder
  acceso; el usuario DEBE permanecer en la pantalla de acceso y recibir un mensaje
  comprensible y genérico (por ejemplo, «Usuario o contraseña incorrectos.»).
- **FR-005**: El mensaje de error de autenticación NO DEBE revelar si el fallo
  corresponde al usuario o a la contraseña, ni confirmar la existencia de un usuario
  concreto.
- **FR-006**: Si el usuario intenta iniciar sesión sin usuario o sin contraseña,
  IDAF NO DEBE iniciar sesión y DEBE mostrar una indicación comprensible.
- **FR-007**: Varios intentos de autenticación incorrectos consecutivos NO DEBEN
  producir errores ni conceder acceso. Esta spec NO implementa bloqueo de cuenta.
- **FR-008**: Intentar acceder directamente a una ruta o sección interna sin sesión
  válida DEBE conducir a la pantalla de acceso, no a la sección solicitada.
- **FR-009**: Recargar una ruta interna válida mientras existe una sesión activa
  DEBE conservar el acceso y mantener al usuario en esa misma sección.
- **FR-010**: Recargar una ruta protegida sin sesión válida DEBE mostrar la pantalla
  de acceso.
- **FR-052**: El conjunto predefinido de credenciales válidas DEBE contener varias
  cuentas distintas (al menos dos); cada cuenta tiene su propia contraseña y su
  propio nombre o identificador mostrado. Todas las cuentas DEBEN tener la misma
  experiencia (ver FR-016). El alta, cambio y recuperación de cuentas quedan fuera
  de alcance.
- **FR-055**: El material que permita verificar una credencial —contraseñas,
  hashes de contraseñas, sales, o la lógica de verificación de credenciales— NO
  DEBE distribuirse al cliente (no DEBE estar presente en el código del frontend ni
  en el paquete/bundle entregado al navegador) NI DEBE estar presente en el
  repositorio. La verificación de credenciales NO DEBE poder realizarse únicamente
  con recursos disponibles en el cliente. Las credenciales válidas DEBEN
  configurarse fuera del código fuente y fuera del bundle. Las contraseñas NUNCA
  DEBEN almacenarse en texto plano. Ni la interfaz, ni los mensajes de error, ni
  ningún registro (consola del navegador o salida del mecanismo de autenticación)
  DEBEN contener el usuario o la contraseña introducidos ni el material de
  verificación.
- **FR-056**: Si la verificación de credenciales no puede completarse por una causa
  distinta de credenciales inválidas (p. ej. el mecanismo de autenticación no
  responde), IDAF NO DEBE iniciar sesión ni crear una sesión, DEBE permanecer en la
  pantalla de acceso y DEBE mostrar un mensaje comprensible que comunique que el
  acceso no se pudo verificar y que se intente de nuevo. Este mensaje DEBE ser
  distinguible del mensaje de credenciales incorrectas (FR-004) y, como aquel, NO
  DEBE revelar datos internos ni si el usuario existe.

**Sesión y cierre de sesión**

- **FR-011**: Mientras exista una sesión válida, DEBE mostrarse una indicación
  visible de sesión activa y una identificación comprensible del usuario autenticado
  (al menos su nombre o identificador).
- **FR-012**: DEBE existir una acción visible y fácilmente identificable para cerrar
  sesión, disponible desde cualquiera de las siete áreas.
- **FR-013**: Al cerrar sesión, la sesión DEBE finalizar de inmediato, el usuario
  DEBE regresar a la pantalla de acceso y las áreas internas NO DEBEN seguir siendo
  accesibles con una sesión válida.
- **FR-014**: Tras cerrar sesión, un intento posterior de acceder a una sección
  protegida sin sesión DEBE conducir a la pantalla de acceso.
- **FR-015**: La identificación del usuario y la acción de cerrar sesión DEBEN
  presentarse agrupadas como elementos de la sesión, separadas visualmente de la
  navegación entre módulos, de modo que cerrar sesión NO pueda confundirse con una
  acción propia del módulo actual.
- **FR-016**: Todos los usuarios autenticados DEBEN tener la misma experiencia
  funcional. Esta spec NO implementa roles, perfiles ni permisos diferenciados.
- **FR-051**: La sesión DEBE sobrevivir a la recarga de página, pero DEBE finalizar
  al cerrar la pestaña o el navegador; tras ese cierre, la siguiente apertura de IDAF
  DEBE mostrar la pantalla de acceso. Esta spec NO implementa expiración por tiempo ni
  cierre por inactividad.
- **FR-057**: Con una sesión válida, abrir la pantalla de acceso DEBE redirigir a
  Inicio. NO DEBE mostrarse un segundo formulario de acceso ni cerrarse la sesión
  activa.
- **FR-058**: Cuando existen varias pestañas o ventanas de IDAF sobre la misma
  sesión y el usuario cierra sesión en una, las demás NO DEBEN permitir seguir
  usando las áreas internas: DEBEN mostrar la pantalla de acceso a más tardar
  cuando se recarguen, cuando la pestaña vuelva a estar activa, o cuando se intente
  una operación que requiera la sesión. Esta spec NO exige propagación del cierre
  de sesión en tiempo real entre pestañas mientras una permanece en segundo plano,
  ni sincronización entre dispositivos.

- **FR-017**: La navegación principal DEBE mantener exactamente las siete áreas:
  Inicio, Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología y
  Observabilidad. NO DEBEN crearse nuevas áreas principales en esta spec.
- **FR-018**: Cada área DEBE mostrar un nombre visible y un icono visualmente
  distinguible; el icono complementa al texto y NUNCA lo reemplaza. El nombre DEBE
  permanecer visible junto al icono.
- **FR-019**: Cada icono DEBE representar de forma reconocible el propósito de su
  módulo: Inicio→inicio/panel; Inventario→dispositivos/listado;
  Descubrimiento→búsqueda/exploración; Conexiones→enlace/conexión;
  Diagnósticos→análisis/diagnóstico; Topología→red/relaciones;
  Observabilidad→métricas/monitoreo.
- **FR-020**: Todos los iconos de navegación DEBEN pertenecer a un único lenguaje
  visual (una misma familia), sin mezclar estilos iconográficos distintos.
- **FR-021**: El área actual DEBE identificarse de forma inmediata: el módulo activo
  se diferencia de los demás mediante al menos dos señales visuales simultáneas, de
  las cuales al menos una DEBE ser no cromática (forma, borde/indicador, peso
  tipográfico, tamaño o icono). El color por sí solo, o un cambio de color que no
  altere ninguna propiedad no cromática respecto del estado inactivo, NO es
  suficiente. El estado activo DEBE seguir siendo distinguible en una simulación de
  percepción sin color (ver SC-015).
- **FR-022**: En cada momento DEBE haber exactamente un módulo principal marcado como
  activo.
- **FR-023**: Alternar rápidamente entre módulos NO DEBE mostrar más de un módulo
  activo ni duplicar contenido.
- **FR-024**: Si un icono no puede mostrarse, el nombre textual del módulo DEBE
  seguir permitiendo identificarlo y utilizar la navegación.
- **FR-025**: Cada módulo DEBE tener una única combinación de nombre e icono en la
  navegación principal; NO DEBEN existir dos entradas distintas para la misma
  funcionalidad.
- **FR-026**: Estando autenticado, el usuario DEBE poder navegar entre todas las
  áreas; al seleccionar un área se muestra su vista y esta queda identificada como
  activa.
- **FR-053**: Con una sesión válida, abrir una ruta que no corresponde a ninguna de
  las siete áreas DEBE redirigir a Inicio, sin mostrar un error ni una vista de
  «no encontrado».

**Identidad y experiencia visual**

- **FR-027**: Esta spec DEBE establecer la experiencia visual definitiva de la
  estructura general de IDAF, con una evolución desde «prototipo navegable» hacia
  «aplicación técnica de diagnóstico y observabilidad de infraestructura de red e
  IoT». Se considera cumplido cuando el resultado presenta, de forma conjunta y
  verificable: (a) identidad de marca con nombre y símbolo (FR-028); (b) sistema de
  color con roles definidos (FR-037); (c) una única familia iconográfica aplicada a
  la navegación (FR-020); (d) encabezado de módulo consistente en las siete áreas
  (FR-033); y (e) tratamiento definido de superficies/tarjetas (FR-035). NO se
  acepta como resultado aplicar solo color y tipografía al prototipo de la SPEC 001
  sin (a)–(e).
- **FR-028**: El producto DEBE ser identificable como IDAF sin depender de la URL ni
  del navegador, tanto en la pantalla de acceso como en cualquier módulo. El nombre
  IDAF DEBE ir acompañado de un símbolo/logotipo conceptualmente asociado a redes,
  nodos, conectividad, IoT, diagnóstico u observabilidad, sin que el símbolo lo
  reemplace.
- **FR-029**: La pantalla de acceso y la aplicación interna DEBEN reconocerse como el
  mismo producto, compartiendo identidad, tipografía, paleta, iconografía y
  tratamiento de controles. La pantalla de acceso DEBE incluir, de forma
  verificable: el nombre IDAF y el símbolo de marca (FR-028), el texto breve de
  propósito que la describe como plataforma técnica de diagnóstico y observabilidad
  de red e IoT (FR-002), y el mismo tratamiento de controles y de mensajes de error
  que la aplicación interna (FR-036, FR-041). NO DEBE contener imágenes o adornos
  puramente decorativos, ni presentar el formulario con un estilo distinto al de
  los formularios/controles de la aplicación interna. Cuando se cumplen estas
  condiciones se considera que la pantalla de acceso no parece una página genérica
  sin identidad ni un formulario administrativo ajeno a redes/IoT.
- **FR-030**: La apariencia general DEBE ser técnica, limpia y sobria, orientada a
  operación y diagnóstico y legible durante sesiones prolongadas. Esto se concreta
  en criterios verificables: (a) no hay imágenes, ilustraciones ni gráficos
  puramente decorativos en ninguna vista; (b) no hay animaciones salvo
  microtransiciones de estado de duración breve (orientativo: ≤ 150 ms) y ninguna
  animación en bucle; (c) el área principal de contenido del módulo es la región de
  mayor superficie de cada vista interna (FR-034, SC-018); (d) el texto de cuerpo
  mantiene un contraste conforme a WCAG 2.1 AA (FR-040) y un interlineado suficiente
  para lectura prolongada (orientativo: ≥ 1,4). Ningún elemento decorativo reduce la
  legibilidad ni compite con la información operacional.
- **FR-031**: Tras autenticarse, la estructura DEBE mantener, de forma reconocible y
  consistente durante toda la sesión: navegación principal, identificación del
  producto, identificación del usuario, acción de cierre de sesión, área principal de
  contenido e indicación del módulo activo.
- **FR-032**: Cada vista DEBE permitir distinguir con claridad el nombre del módulo,
  su estado o contenido principal, la navegación global y las acciones asociadas a la
  sesión.
- **FR-033**: Cada módulo DEBE comenzar con un encabezado consistente que indique el
  nombre del módulo y, cuando aporte claridad, una descripción breve de su propósito.
- **FR-034**: El área principal de contenido DEBE quedar dimensionada y preparada
  para que specs posteriores incorporen tablas, métricas, tarjetas, gráficas,
  alertas, topologías y resultados de diagnóstico sin rediseñar la estructura
  global. Esta spec NO DEBE implementar ni simular esos contenidos.
- **FR-035**: DEBE existir un tratamiento visual definido de superficies/tarjetas
  para agrupar información que represente unidades independientes, dejando preparado
  ese lenguaje sin mostrar datos ni métricas ficticias.
- **FR-059**: La pantalla de Inicio DEBE conservar su propósito de la SPEC 001:
  mostrar la identidad del producto, una explicación breve y una vista general de
  las siete áreas con su estado de disponibilidad («Disponible» / «No disponible»),
  ahora con la identidad visual definitiva y el encabezado de módulo consistente
  (FR-033). Esa vista general es informativa; si sus elementos enlazan a las áreas,
  NO sustituye ni oculta la navegación principal, que permanece visible (FR-031), y
  NO constituye una segunda navegación. Inicio NO DEBE incorporar datos
  operacionales, métricas ni contenidos simulados (FR-034).

**Consistencia visual, color, estados y densidad**

- **FR-036**: Las siete áreas DEBEN compartir una misma identidad visual, con
  consistencia en tipografía, espaciado, estilos de títulos, comportamiento de
  navegación, iconografía, estados activos, mensajes de error, botones y estructura
  general. Ningún módulo DEBE aparentar pertenecer a otra aplicación.
- **FR-037**: La paleta DEBE definir un color principal de identidad, colores neutros
  para fondos, superficies y texto, y un conjunto de colores semánticos de estado
  (correcto/disponible/conectado; advertencia/atención; error/fallo/desconectado;
  identidad/navegación/selección/información).
- **FR-038**: El significado de cada color semántico DEBE ser consistente en toda la
  aplicación y NO DEBE cambiar entre módulos.
- **FR-039**: El color NUNCA DEBE ser el único mecanismo para comunicar un estado;
  cada estado DEBE ir acompañado de otra señal (texto, icono, forma o patrón), de
  modo que siga siendo comprensible sin interpretar el color.
- **FR-040**: El contraste DEBE cumplir la guía **WCAG 2.1 AA** (4,5:1 para texto
  normal; 3:1 para texto grande y para componentes de interfaz y estados gráficos),
  como mínimo entre: texto y fondo; módulo activo e inactivos; botones y
  superficies; indicador de foco de teclado y su fondo; y los estados normal,
  advertencia y error entre sí. Este es el mismo umbral que SC-016. Los textos
  secundarios PUEDEN tener menor énfasis pero DEBEN seguir cumpliendo el contraste
  AA aplicable a su tamaño.
- **FR-041**: Los elementos interactivos DEBEN comunicar visualmente, como mínimo,
  los estados normal, seleccionado, foco de teclado, deshabilitado y error cuando
  corresponda. Un elemento deshabilitado NO DEBE aparentar estar disponible.
- **FR-042**: La interfaz DEBE favorecer una densidad de información moderada, con
  estos límites verificables: (a) el título de módulo (`<h1>` del encabezado) no
  supera ~2× el tamaño del texto de cuerpo («título sobredimensionado»); (b) dentro
  del área de contenido visible no hay ningún espacio en blanco vertical continuo,
  sin contenido y sin propósito, mayor que ~1,5× la altura del encabezado de módulo
  («espacio excesivamente grande»); (c) la decoración no ocupa área útil del
  contenido; (d) el interlineado del texto de cuerpo es ≥ 1,4 y el área activa de
  los controles interactivos es de al menos 24×24 px («no excesivamente compacta»).
- **FR-054**: Además del foco de teclado visible (FR-041) y del contraste WCAG 2.1 AA
  (FR-040, SC-016), todos los elementos interactivos —el formulario de acceso
  (campos y acción de iniciar sesión, incluido el control de mostrar/ocultar
  contraseña si existe), las siete entradas de navegación, la acción de cerrar
  sesión y las acciones de la vista de error de sección— DEBEN ser completamente
  operables con teclado (alcanzables, activables y sin trampa de foco) y DEBEN
  exponer un nombre y un rol accesibles. Las zonas principales (navegación,
  identidad de producto, contexto de sesión y contenido) DEBEN exponerse como
  regiones identificables mediante *landmarks* o una región con nombre accesible
  equivalente para el contexto de sesión. El foco DEBE gestionarse así: al iniciar
  sesión, se mueve al encabezado del módulo de Inicio; al cerrar sesión, al
  formulario de acceso; y cuando el inicio de sesión falla (credenciales inválidas
  o verificación no disponible), al mensaje de error o permanece en el formulario
  de acceso. La conformidad WCAG 2.1 AA completa (lectores de pantalla, orden de
  foco exhaustivo, etc.) queda fuera de alcance.

**Módulos pendientes**

- **FR-043**: Esta spec NO DEBE hacer funcionales los seis módulos sin lógica
  operacional (Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología,
  Observabilidad); DEBEN seguir mostrando su condición de «No disponible» hasta que
  una spec posterior implemente su lógica.
- **FR-044**: Cada vista de módulo no disponible DEBE conservar la identidad visual
  de IDAF y presentar el icono del módulo, su nombre, el estado «No disponible» y una
  explicación breve de incorporación futura, sin gráficas, dispositivos, métricas ni
  botones que aparenten operar. La mejora visual NO DEBE hacer que una funcionalidad
  inexistente aparente estar disponible.

**Casos límite de estructura**

- **FR-045**: Un nombre o identificador de usuario más largo de lo habitual NO DEBE
  romper la estructura principal; DEBE ajustarse o truncarse de forma definida sin
  desplazar la navegación ni el contenido.
- **FR-046**: Al reducir moderadamente el ancho de la ventana de escritorio (dentro
  del rango soportado), la navegación, la identificación de sesión y la acción de
  cerrar sesión DEBEN permanecer visibles y utilizables. El soporte móvil completo
  queda fuera de alcance.
- **FR-047**: Un mensaje de error más extenso de lo habitual NO DEBE superponerse a
  otros controles ni volver inutilizable la vista.

**Alcance y restricciones**

- **FR-048**: Se mantienen las siete áreas de la SPEC 001. Esta spec PUEDE modificar
  la estructura visual y de navegación existente, pero NO PUEDE agregar lógica
  operacional a los seis módulos pendientes.
- **FR-049**: La interfaz visible DEBE permanecer en español.
- **FR-050**: Esta especificación NO DEBE fijar la tecnología de implementación
  (framework de estilos, librería de componentes, librería de iconos, valores
  hexadecimales, tamaños en píxeles, tecnología de temas, mecanismo técnico de
  autenticación y de sesión, ni implementación CSS); esas decisiones corresponden a
  `/speckit.plan`.

### Key Entities

- **Sesión**: acceso autenticado y vigente de un usuario a IDAF. Atributos
  conceptuales: usuario asociado y estado (activa / finalizada). Se crea con
  credenciales válidas verificadas fuera del cliente (FR-055); determina si el
  contenido interno es accesible; persiste ante la recarga de página y finaliza al
  cerrar sesión o al cerrar la pestaña o el navegador. Con la sesión activa, abrir
  la pantalla de acceso lleva a Inicio (FR-057); si hay varias pestañas sobre la
  misma sesión, cerrar sesión en una obliga a las demás a exigir acceso a más tardar
  al recargar o reactivarse (FR-058).
- **Credenciales de acceso**: par usuario + contraseña que se introduce en la
  pantalla de acceso. Su validez determina si se inicia sesión. El conjunto de
  credenciales válidas es predefinido y contiene varias cuentas distintas, cada una
  con su propia contraseña y su propio nombre o identificador mostrado; su alta,
  cambio y recuperación quedan fuera de alcance.
- **Identidad de usuario mostrada**: nombre o identificador del usuario autenticado,
  visible durante la sesión como parte del contexto de sesión. Cada cuenta define su
  propio nombre o identificador mostrado.
- **Área principal (módulo)**: una de las siete secciones fijas. Atributos
  conceptuales: nombre, icono, estado de disponibilidad (disponible / no disponible)
  y condición de activo (solo una a la vez).
- **Sistema visual**: conjunto de decisiones de identidad reutilizadas en el acceso y
  en la aplicación: marca (nombre + símbolo), roles de color (identidad, neutros,
  semánticos), tipografía, familia iconográfica, superficies/tarjetas, encabezado de
  módulo, estados de interacción y tratamiento de mensajes de error.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al abrir IDAF sin sesión, el 100 % de las veces se muestra la pantalla
  de acceso y ninguna de las siete áreas internas es visible o accesible.
- **SC-002**: Un usuario que conoce credenciales válidas completa el inicio de sesión
  y llega a Inicio con la navegación disponible en el 100 % de los intentos, en menos
  de 30 segundos (medido según §Evaluación con personas → «Medición de tiempos»).
- **SC-003**: Con credenciales no válidas o campos vacíos, el 100 % de los intentos
  permanece en la pantalla de acceso y muestra un mensaje comprensible que no indica
  cuál campo falló.
- **SC-004**: Tras cerrar sesión, el 100 % de los intentos de abrir una ruta interna
  termina en la pantalla de acceso.
- **SC-005**: Recargar una ruta interna con sesión activa conserva el acceso y la
  sección en el 100 % de los intentos; recargar una ruta protegida sin sesión
  muestra el acceso en el 100 % de los intentos.
- **SC-006**: El 100 % de los evaluadores identifica el producto como IDAF observando
  la pantalla de acceso y una vista interna sin ver la URL.
- **SC-007**: El 100 % de los evaluadores describe la pantalla de acceso y la
  aplicación interna como «el mismo producto» y como una herramienta técnica de
  redes/IoT/diagnóstico; ninguno la describe como plantilla administrativa genérica o
  prototipo sin terminar.
- **SC-008**: Un usuario autenticado localiza su identificación de sesión y la acción
  de cerrar sesión en menos de 5 segundos desde cualquiera de las siete áreas, en el
  100 % de los intentos (medido según §Evaluación con personas → «Medición de
  tiempos»).
- **SC-009**: En pruebas con usuarios, cero personas confunden «Cerrar sesión» con
  una acción del módulo actual.
- **SC-010**: Un evaluador identifica correctamente el módulo activo en 3 segundos o
  menos y sin leer la URL, en el 100 % de los intentos sobre las siete áreas (medido
  según §Evaluación con personas → «Medición de tiempos»).
- **SC-011**: Durante un recorrido completo de las siete áreas y alternando
  rápidamente entre ellas, exactamente un módulo aparece activo en todo momento y no
  se duplica contenido: cero excepciones.
- **SC-012**: El 100 % de las entradas de navegación muestra nombre e icono; con el
  icono oculto, el 100 % sigue siendo utilizable por su nombre.
- **SC-013**: El 100 % de los iconos de navegación pertenece a una única familia
  visual y, presentados sin etiqueta, se asocian correctamente a su área según la
  rúbrica de §Evaluación con personas (media por icono ≥ 0,90, piso por icono ≥ 0,60
  y ≥ 80 % del panel confirma que son una misma familia visual).
- **SC-014**: Las seis vistas de módulos no disponibles conservan la identidad de
  IDAF e incluyen icono, nombre, estado «No disponible» y explicación; cero elementos
  simulados (gráficas, métricas, dispositivos, botones operativos).
- **SC-015**: En una simulación de percepción sin color, el 100 % de los estados
  correcto/advertencia/error y el módulo activo siguen distinguibles por una señal no
  cromática.
- **SC-016**: El texto y los componentes de interfaz esenciales cumplen el contraste
  de la guía WCAG 2.1 AA (4,5:1 para texto normal; 3:1 para texto grande y
  componentes) en el acceso y en las siete áreas.
- **SC-017**: En el 100 % de las vistas internas se distinguen como zonas separadas
  la navegación global, la identificación del producto, el contexto de sesión y el
  área de contenido.
- **SC-018**: El área de contenido del módulo es la región de mayor superficie de la
  vista interna y queda disponible para información operacional futura sin rediseño de
  la estructura global.
- **SC-019**: Revisión cruzada entre las siete áreas: tipografía, espaciado, estilos
  de título, comportamiento de navegación, iconografía, estados activos, mensajes de
  error, botones y estructura general usan el mismo tratamiento (la misma lista de
  aspectos que FR-036); cero divergencias. **Umbral objetivo de «divergencia»**: para
  cada uno de los 9 aspectos, «mismo tratamiento» significa que el aspecto se produce
  en las siete áreas a partir del mismo token de `tokens.css`, del mismo componente
  compartido o de la misma regla de `base.css`. Cuenta como **una divergencia** cada
  par (área, aspecto) en el que el aspecto se resuelve con un valor de token distinto,
  con un componente distinto, o con un valor codificado directamente que no pasa por
  la fuente compartida. Se cumple con divergencias = 0.
- **SC-020**: Un identificador de usuario de al menos 40 caracteres no desplaza ni
  oculta la navegación ni el contenido; un mensaje de error de al menos 200
  caracteres no se superpone a otros controles ni impide completar la acción.
- **SC-021**: Reduciendo el ancho de la ventana de escritorio hasta el ancho mínimo
  soportado, la navegación, la identificación de sesión y el cierre de sesión
  permanecen visibles y utilizables.
- **SC-022**: El 100 % de los elementos interactivos (formulario de acceso —incluido
  el control de mostrar/ocultar contraseña si existe—, las siete entradas de
  navegación, la acción de cerrar sesión y las acciones de la vista de error de
  sección) se puede alcanzar y activar solo con teclado, sin trampa de foco, con
  foco visible, nombre y rol accesibles; las cuatro zonas principales se exponen
  como regiones identificables; y el foco se reubica al encabezado del módulo de
  Inicio al iniciar sesión, al formulario de acceso al cerrar sesión, y al mensaje
  de error (o permanece en el formulario) cuando el inicio de sesión falla.
  Verificado en los tres navegadores de escritorio soportados.
- **SC-023**: Con una sesión activa, abrir una ruta que no corresponde a ninguna de
  las siete áreas termina en Inicio en el 100 % de los intentos, sin mostrar un error
  ni una vista de «no encontrado».
- **SC-024**: Cerrar la pestaña o el navegador sin cerrar sesión y volver a abrir
  IDAF muestra la pantalla de acceso en el 100 % de los intentos; recargar la página
  con sesión activa la conserva.
- **SC-025**: Una inspección del repositorio y del paquete/bundle entregado al
  navegador no encuentra contraseñas, hashes de contraseñas, sales ni lógica de
  verificación de credenciales, y el conjunto de credenciales válidas no está en el
  repositorio; 100 % de las revisiones.
- **SC-026**: En un recorrido de inicio de sesión con caso válido, caso inválido y
  caso de verificación no disponible, ningún registro observable (consola del
  navegador y salida del mecanismo de autenticación) contiene el usuario ni la
  contraseña introducidos; cero excepciones.
- **SC-027**: Cuando la verificación de credenciales no está disponible, el 100 %
  de los intentos permanece en la pantalla de acceso, no crea sesión y muestra un
  mensaje distinto del de credenciales incorrectas.
- **SC-028**: Con una sesión activa, abrir la pantalla de acceso termina en Inicio
  en el 100 % de los intentos, sin cerrar la sesión y sin mostrar un segundo
  formulario.
- **SC-029**: Con dos pestañas sobre la misma sesión, tras cerrar sesión en una, la
  otra muestra la pantalla de acceso al recargar y al reactivarse (volver a ella)
  en el 100 % de los intentos; ninguna operación posterior en esa pestaña accede a
  las áreas internas.
- **SC-030**: La pantalla de Inicio presenta la identidad del producto, la
  explicación breve y la vista general de las siete áreas con su estado; no muestra
  datos operacionales, métricas ni contenidos simulados, y la navegación principal
  permanece visible; cero excepciones.
- **SC-031** (ancla FR-021, FR-022, FR-023): En cada una de las siete vistas
  internas aparece **exactamente una** entrada de navegación activa (cero vistas con
  ninguna o con más de una), y la entrada activa se diferencia de las inactivas en
  **al menos dos propiedades visuales renderizadas simultáneamente** (indicador de
  forma/barra de acento, peso tipográfico, tamaño, icono o fondo), de las cuales
  **al menos una no es cromática** y permanece perceptible en la simulación de
  acromatopsia de SC-015. Se cumple en el 100 % de las siete vistas y sin
  excepciones al alternar rápidamente entre módulos (≥ 20 alternancias).
- **SC-032** (ancla FR-030(a)): En la pantalla de acceso y en las siete áreas, el
  100 % de los elementos gráficos (`<img>`, `background-image`, `<svg>`, `<canvas>`)
  es funcional —símbolo de marca, iconos de navegación o de interfaz, iconos de
  estado— o no existe; cero imágenes, ilustraciones o gráficos puramente
  decorativos que compitan con la información funcional.
- **SC-033** (ancla FR-030(b)): En la pantalla de acceso y en las siete áreas, toda
  transición o animación tiene una duración computada ≤ 150 ms y un
  `animation-iteration-count` finito; cero animaciones en bucle o infinitas. 100 %
  de los elementos animados.
- **SC-034** (ancla FR-030(d), FR-042(d)): El texto de contenido (cuerpo y párrafos
  de módulo) tiene un `line-height` computado ≥ 1,4 en la pantalla de acceso y en
  las siete áreas; 100 % de los bloques de texto de contenido.
- **SC-035** (ancla FR-042(a), (b), (c)): En Inicio y en cada vista de módulo se
  cumplen simultáneamente: (a) el `font-size` computado del `<h1>` del encabezado de
  módulo ≤ 2,0 × el `font-size` del texto de cuerpo; (b) dentro del área de
  contenido visible no existe ningún hueco vertical continuo, sin contenido y sin
  propósito, de altura > 1,5 × la altura renderizada del `ModuleHeader`; (c) el área
  activa (*hit target*) de todo control interactivo ≥ 24 × 24 px. El interlineado
  ≥ 1,4 se verifica en SC-034. 100 % de las vistas; cero excepciones.
- **SC-036** (ancla FR-027): El resultado presenta, de forma conjunta y verificable,
  los cinco elementos de FR-027: (a) identidad de marca con nombre y símbolo;
  (b) sistema de color con roles definidos; (c) una única familia iconográfica en la
  navegación; (d) encabezado de módulo consistente en las siete áreas;
  (e) tratamiento definido de superficies/tarjetas. Se cumple si los cinco están
  presentes —verificado por la unión de SC-006, SC-013, SC-016, SC-017 y SC-019 más
  una comprobación estructural de (a)–(e)—; no se acepta si falta cualquiera de
  (a)–(e).
- **SC-037** (ancla FR-029): La pantalla de acceso contiene, de forma verificable:
  (1) el nombre IDAF y el símbolo de marca; (2) el texto breve de propósito que la
  describe como plataforma técnica de diagnóstico y observabilidad de red e IoT;
  (3) el mismo tratamiento de botones y de mensajes de error que la aplicación
  interna (mismos componentes y tokens); (4) cero imágenes o adornos puramente
  decorativos. Además, el formulario de acceso no se presenta con un estilo distinto
  al de los formularios y controles de la aplicación interna. 100 % de las
  revisiones.
- **SC-038** (ancla FR-025): Cada una de las siete áreas tiene exactamente una
  entrada de navegación con una combinación (nombre, icono) única; cero entradas
  duplicadas para la misma funcionalidad; la vista general de Inicio y la navegación
  principal se derivan de la misma fuente única (`MODULE_REGISTRY`). 100 % de las
  revisiones.

### Evaluación con personas

Los criterios que dependen del juicio de personas (SC-006, SC-007, SC-009, SC-010,
SC-013) se comprueban con este protocolo **normativo**. La subsección «Medición de
tiempos» rige además SC-008 y SC-010 (con panel) y SC-002 (automatizada, sin
panel).

#### Panel y cribado de evaluadores

- **Tamaño**: mínimo 5 evaluadores; sin máximo. Los umbrales son proporciones y se
  evalúan sobre el panel vigente (100 % = todos los evaluadores del panel).
- **Perfil técnico**: operación o administración de redes/infraestructura, o rol
  equivalente (SRE, soporte de red, ingeniería IoT).
- **Sin conflicto de diseño**: ninguno ha participado en el diseño, la
  especificación ni la implementación de esta feature (SPEC 002).
- **Sin exposición previa (cuando aplica)**: para **SC-006 y SC-007**
  (reconocimiento de producto a primera vista), además, ninguno ha visto antes IDAF
  ni el prototipo de la SPEC 001 o de la SPEC 002. Para **SC-009, SC-010 y SC-013**
  (localización, tiempo de identificación y asociación de iconos) se admite
  exposición previa siempre que no haya participado en el diseño.
- **Condiciones**: cada evaluador realiza las tareas de forma individual, sin ver la
  URL ni la barra de direcciones y sin recibir pistas sobre el nombre o la función
  del producto. Se conserva grabación de pantalla y audio de cada sesión.

#### Material mostrado

- Pantalla de acceso (**Login**).
- Vista interna A = **Inicio**.
- Vista interna B = una vista de módulo **«No disponible»**: se usa **Topología**
  (cubre «identidad en cualquier módulo», FR-028).
- Orden de presentación fijo: Login → Inicio → Topología.

#### Preguntas literales (se leen textualmente, sin variación ni sinónimos)

Para **SC-006 / SC-007**:

- **P1**: «¿Cómo se llama este producto?»
- **P2**: «Describe en una sola frase qué hace este producto.»
- **P3** (tras mostrar las tres pantallas): «¿Estas pantallas pertenecen al mismo
  producto? Responde Sí o No.»
- **P4**: «¿Dirías que esto es una herramienta terminada o algo sin terminar? ¿Por
  qué?»

Para **SC-009** (tras recorrer 2–3 áreas):

- **P5** (instrucción literal): «Cierra la sesión.» No se da ninguna otra
  indicación; el facilitador no señala ningún control.

Para **SC-010** (por cada una de las siete áreas, con la vista ya renderizada):

- **P6**: «¿En qué área estás ahora?»

Para **SC-013** (siete iconos sin etiqueta a la vista, más la lista de los siete
nombres de área):

- **P7**: «Une cada icono con el área a la que crees que corresponde.»
- **P8**: «¿Los siete iconos parecen del mismo conjunto visual? Responde Sí o No.»

#### Rúbrica de SC-006 — nombre del producto

- **Respuesta válida**: la respuesta a P1 es «IDAF» (mayúsculas/minúsculas
  indiferentes; se acepta «el IDAF» o «IDAF» deletreado).
- **Aprobación**: 100 % del panel responde «IDAF».
- Cualquier otra respuesta —incluidas «no sé», un nombre inventado, «un panel», «un
  dashboard»— cuenta como fallo del evaluador para SC-006.

#### Rúbrica de SC-007 — mismo producto + herramienta técnica de redes/IoT/diagnóstico

SC-007 se aprueba si, para el **100 %** del panel, se cumplen **las tres**
condiciones:

1. **Mismo producto** — la respuesta a P3 es «Sí».
2. **Herramienta técnica de redes/IoT/diagnóstico** — la frase de P2 (o la
   justificación de P4) nombra **a la vez** un concepto de **dominio** y uno de
   **función** de estas listas (palabra exacta o sinónimo inequívoco):
   - **Dominio**: red / redes / networking / infraestructura de red / IoT /
     dispositivos conectados / nodos.
   - **Función**: diagnóstico / observabilidad / monitoreo / monitorización /
     supervisión / inventario / descubrimiento / topología / análisis de red.
   Ejemplos **válidos**: «monitorea y diagnostica una red de dispositivos IoT»;
   «herramienta para observar y diagnosticar infraestructura de red»; «inventario y
   topología de dispositivos de red».
   Se clasifica como **inválida por genérica** («plantilla administrativa
   genérica») toda respuesta que: (a) solo mencione gestión administrativa sin
   dominio de red/IoT —«un panel de administración», «un CRM», «un backoffice»,
   «una plantilla de dashboard», «un sistema de gestión» a secas, «una app de
   administración de usuarios»—; o (b) no permita distinguir el producto de un
   panel administrativo cualquiera (no aparece ni dominio ni función de las listas).
3. **No «sin terminar»** — la respuesta a P4 **no** describe el producto **en su
   conjunto** como «prototipo», «demo», «maqueta», «sin terminar», «incompleto» o
   equivalente. Describir un **módulo concreto** como «no disponible» no cuenta como
   «sin terminar» (es el estado esperado, FR-043).

#### Registro de dudas y respuestas ambiguas (SC-006 / SC-007)

- El facilitador transcribe **literalmente** P1–P4 de cada evaluador antes de
  clasificar.
- Si una respuesta es ambigua respecto de la rúbrica (p. ej. «un sistema» sin
  dominio), el facilitador formula **una sola** repregunta neutra: «¿Puedes
  concretar un poco más?», y transcribe la ampliación. No se repregunta más de una
  vez ni se sugieren términos.
- Si tras la repregunta la respuesta **sigue sin encajar** claramente en «válida»,
  se clasifica como **fallo del evaluador** (la ambigüedad no se resuelve a favor).
- **Dos revisores** clasifican cada transcripción de forma independiente contra la
  rúbrica; una discrepancia se resuelve releyendo la rúbrica literalmente y, si
  persiste, cuenta como fallo.

#### Rúbrica de SC-009 — «expresa duda» observable

SC-009 se aprueba si, para el **100 %** del panel, **no** se observa **ninguna** de
estas conductas tras P5 «Cierra la sesión»:

- (a) el evaluador activa, señala o pasa el cursor sobre un control **del área de
  contenido del módulo** (no del header) como intento de cerrar sesión;
- (b) el evaluador pregunta en voz alta dónde está «Cerrar sesión», o si pertenece
  al módulo, o expresa verbalmente incertidumbre sobre qué control usar (frases del
  tipo «¿esto cierra la sesión o…?», «no sé si es aquí», «¿es este botón del
  módulo?»);
- (c) el evaluador tarda **más de 10 s** en dirigirse al control «Cerrar sesión»
  del header.

Se transcribe literalmente cualquier frase emitida y el control tocado en primer
lugar. Cero conductas (a)–(c) en todo el panel = aprobado.

#### Rúbrica de SC-013 — asociación icono→área y familia visual

- Por cada icono se calcula `aciertos / nº de evaluadores`.
- SC-013 se aprueba si: la **media de esa proporción sobre los siete iconos**
  ≥ 0,90 **y** ningún icono individual queda por debajo de **0,60** (piso por
  icono) **y** ≥ 80 % del panel responde «Sí» a P8 (misma familia visual).

#### Medición de tiempos (SC-002, SC-008, SC-010)

| Criterio | Evento de inicio (t0) | Evento de fin (t1) | Instrumento | Umbral |
|----------|-----------------------|--------------------|-------------|--------|
| **SC-002** | Activación de la acción «Iniciar sesión» con credenciales válidas ya escritas | El `<h1>` de Inicio recibe el foco y la navegación de las 7 áreas es visible | Marca de tiempo del *test runner* (Playwright); automatizado, sin panel | < 30 000 ms |
| **SC-008** | El facilitador termina de leer la instrucción «Encuentra quién ha iniciado sesión y cómo se cierra la sesión» | El evaluador señala o enfoca **ambos**: la identificación de usuario y el control «Cerrar sesión» | Cronómetro digital (resolución 0,1 s) medido sobre la grabación de pantalla en revisión posterior | < 5,0 s |
| **SC-010** | La vista del área queda completamente renderizada y el facilitador dice «ya» | El evaluador pronuncia el nombre de un área | Cronómetro digital (0,1 s) sobre la grabación de pantalla + audio, medido en revisión posterior (elimina el error de reacción del facilitador) | ≤ 3,0 s |

- SC-008 y SC-010 se puntúan sobre la **grabación**; el valor en vivo es
  orientativo, el de la grabación es el que cuenta.
- SC-002 no usa panel de personas: es una medición automatizada del *test runner*.

#### Política de re-test de criterios bloqueantes

Aplica a **SC-006, SC-007 y SC-009** (bloqueantes; ver `quickstart.md` §6):

- Si **un** evaluador falla el criterio, se corrige la **causa raíz en el producto**
  (no en el protocolo) y se repite el criterio con un **panel nuevo** de ≥ 5
  evaluadores que cumplan el cribado; los evaluadores del intento fallido quedan
  excluidos por exposición previa.
- No se aprueba «por mayoría»: el umbral es 100 % del panel vigente.
- Máximo **2 re-tests** por criterio; si al tercer intento no se alcanza el 100 %,
  el criterio se escala a decisión explícita de la persona propietaria de la
  feature, documentada en el PR.
- **SC-008, SC-010 y SC-013** son de «juicio» (no bloqueantes): un fallo se registra
  y genera una tarea de refinamiento; no exigen re-test con panel nuevo.

## Assumptions

- El resultado se aplica sobre la aplicación de la SPEC 001
  (`001-idaf-foundation-navigation`): mismas siete áreas y vistas, ahora con acceso
  autenticado, identificación de sesión, cierre de sesión, navegación con icono +
  nombre e identidad visual definitiva. La SPEC 002 puede modificar la estructura
  visual y de navegación existente.
- Existe un conjunto predefinido de credenciales válidas configurado fuera de la
  interfaz, compuesto por varias cuentas distintas (al menos dos); cada cuenta tiene
  su propia contraseña y su propio nombre o identificador mostrado, y todas comparten
  la misma experiencia (FR-016). Esta spec no crea, modifica, recupera ni elimina
  usuarios ni contraseñas; el mecanismo técnico de autenticación y de mantenimiento
  de la sesión se decide en `/speckit.plan`. El material de verificación de
  credenciales no se distribuye al cliente ni se guarda en el repositorio, y las
  contraseñas no se almacenan en texto plano (FR-055).
- La sesión se considera «activa» mientras el usuario no cierre sesión y sobrevive a
  la recarga de página; cerrar la pestaña o el navegador finaliza la sesión. Con
  varias pestañas sobre la misma sesión, cerrar sesión en una hace que las demás
  exijan acceso a más tardar al recargar, al reactivarse o al intentar una operación
  que requiera la sesión (FR-058); no se exige propagación en tiempo real. Abrir la
  pantalla de acceso con sesión activa redirige a Inicio (FR-057). La expiración por
  tiempo, el cierre por inactividad y la sincronización de sesión entre dispositivos
  quedan fuera de alcance salvo definición posterior.
- «Identificación comprensible del usuario» se cumple mostrando el nombre o
  identificador con el que se autenticó; no se requieren avatar, correo, rol ni datos
  de perfil.
- Se crea, como parte de esta feature, un símbolo/logotipo original y sencillo junto
  al nombre IDAF para reforzar la identidad de producto; no existe un recurso de marca
  previo que reutilizar (RD-01, RD-02).
- Se entrega un único tema visual definitivo, definido de modo que un tema alternativo
  (por ejemplo claro/oscuro) pueda añadirse más adelante sin reestructurar la
  aplicación.
- Plataforma objetivo: navegadores de escritorio en anchos habituales de portátil y
  monitor; el ancho mínimo soportado se concreta en `/speckit.plan` (fijado en
  1024 px). El soporte móvil/responsive completo queda fuera de alcance.
- Verificación con personas: los criterios SC-006, SC-007, SC-009, SC-010 y SC-013
  se comprueban con un panel de al menos 5 evaluadores de perfil técnico ajenos al
  diseño, según «Evaluación con personas». Son de juicio humano; su carácter
  bloqueante o no se detalla en `quickstart.md`.
- Referencia de contraste: WCAG 2.1 AA, como criterio verificable y neutral respecto
  de la tecnología.
- Alcance de accesibilidad: además del foco de teclado visible y del contraste
  WCAG 2.1 AA, se exige operabilidad completa por teclado de los elementos
  interactivos, nombres/roles accesibles en los controles, landmarks para las zonas
  principales y gestión razonable del foco al iniciar y cerrar sesión. La conformidad
  WCAG 2.1 AA completa (lectores de pantalla, orden de foco exhaustivo, etc.) queda
  fuera de alcance de esta spec.
- Idioma de la interfaz: español, consistente con la SPEC 001.
- No se muestran datos operacionales (dispositivos, métricas, eventos, enlaces,
  diagnósticos) reales ni simulados; solo se prepara el lenguaje visual para
  alojarlos.
- «No revelar si falló el usuario o la contraseña» es un requisito de presentación
  del mensaje; esta spec no define política de registro de intentos ni telemetría de
  seguridad. No obstante, ni la interfaz ni ningún registro observable deben contener
  las credenciales introducidas ni el material de verificación (FR-055, SC-026).

## Dependencies

- SPEC 001 (`001-idaf-foundation-navigation`): estructura de siete áreas, navegación
  y vistas de «funcionalidad no disponible».
- Constitución de IDAF: Principio VIII (seguridad de acceso — las credenciales y
  secretos no deben exponerse en código fuente, logs ni interfaces), materializado en
  FR-055 y verificado por SC-025/SC-026; y la honestidad del producto (los módulos
  pendientes no deben aparentar funcionar).

## Out of Scope

- Inventario funcional de dispositivos, descubrimiento de red, conexión real con
  dispositivos, SSH, ejecución de comandos, diagnóstico IoT, topología real, métricas
  operativas, telemetría y observabilidad real.
- OpenWrt, OpenThread, redes Mesh e inteligencia artificial.
- Administración de usuarios, creación de usuarios desde la interfaz, recuperación y
  cambio de contraseña, autenticación multifactor, permisos, perfiles, roles
  diferenciados y bloqueo automático de cuentas.
- Propagación en tiempo real del cierre de sesión entre pestañas o dispositivos y
  sincronización de sesión multidispositivo (FR-058 define solo el comportamiento
  mínimo entre pestañas).
- Contenido operacional de los módulos (tablas, métricas, gráficas, topologías,
  diagnósticos), real o simulado.
- Soporte móvil y diseño responsive completo.
- Internacionalización más allá del español.
- Elección de tecnología: framework de estilos, librería de componentes, librería de
  iconos, valores hexadecimales, tamaños en píxeles, tecnología de temas, mecanismo
  técnico de autenticación e implementación CSS (corresponde a `/speckit.plan`).
