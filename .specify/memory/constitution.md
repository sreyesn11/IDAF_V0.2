<!--
SYNC IMPACT REPORT
==================
Version change: (plantilla sin ratificar) → 1.0.0
Rationale: Ratificación inicial. El archivo previo contenía únicamente la plantilla
sin completar; esta versión establece por primera vez los principios de gobernanza
de IDAF, por lo que se adopta como versión MAJOR inicial 1.0.0.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Descubrimiento seguro y no destructivo
  - [PRINCIPLE_2_NAME] → II. Separación entre descubrimiento y gestión
  - [PRINCIPLE_3_NAME] → III. Identidad única y consistente
  - [PRINCIPLE_4_NAME] → IV. Diagnóstico trazable
  - [PRINCIPLE_5_NAME] → V. Arquitectura modular y extensible

Added principles (nuevos respecto a la plantilla de 5 slots):
  - VI. Independencia tecnológica y de fabricante
  - VII. Diagnóstico antes que modificación
  - VIII. Seguridad de acceso
  - IX. Observabilidad como capacidad fundamental
  - X. Evolución hacia diagnóstico inteligente
  - XI. Fuente de verdad consistente
  - XII. Integridad del sistema

Added sections:
  - Restricciones Adicionales (materializa [SECTION_2_NAME]/[SECTION_2_CONTENT])
  - Flujo de Desarrollo y Puertas de Calidad (materializa [SECTION_3_NAME]/[SECTION_3_CONTENT])

Removed sections: ninguna

Templates / archivos dependientes:
  - .specify/templates/plan-template.md ✅ sin cambios requeridos (el "Constitution
    Check" resuelve las puertas leyendo este archivo en tiempo de ejecución)
  - .specify/templates/spec-template.md ✅ sin cambios requeridos
  - .specify/templates/tasks-template.md ✅ sin cambios requeridos

Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Fecha de adopción asumida como 2026-09-05 (fecha de esta
    ratificación inicial). Confirmar con el responsable del proyecto si existe una
    fecha de adopción formal anterior.
-->

# Constitución de IDAF

## Core Principles

### I. Descubrimiento seguro y no destructivo

IDAF DEBE descubrir y analizar dispositivos sin alterar su configuración ni afectar
su operación normal. Las actividades de descubrimiento, recolección y diagnóstico
DEBEN limitarse a operaciones de solo lectura sobre el dispositivo.

Toda acción capaz de modificar un dispositivo DEBE ser explícita, controlada y
claramente diferenciada de las actividades de descubrimiento y diagnóstico; NUNCA
DEBE ejecutarse como efecto secundario de estas.

**Rationale**: IDAF opera sobre infraestructura en producción; cualquier cambio no
intencionado durante el descubrimiento puede provocar interrupciones de servicio.

### II. Separación entre descubrimiento y gestión

Un dispositivo descubierto NO se considera automáticamente un dispositivo
administrado. IDAF DEBE mantener una separación explícita entre los estados:

* dispositivos detectados;
* dispositivos pendientes de validación;
* dispositivos aprobados;
* dispositivos administrados.

La incorporación de un dispositivo al inventario gestionado DEBE requerir una
decisión explícita registrada; NUNCA DEBE producirse de forma automática.

**Rationale**: Evita que ruido de red o falsos positivos contaminen el inventario
operacional y garantiza control humano sobre el alcance de la gestión.

### III. Identidad única y consistente

IDAF DEBE mantener una identidad estable para cada dispositivo a lo largo del
tiempo. La información obtenida desde diferentes interfaces, direcciones IP,
protocolos o ejecuciones de descubrimiento DEBE correlacionarse contra esa
identidad para evitar duplicados y preservar el historial del dispositivo.

**Rationale**: Sin correlación de identidad, cada re-descubrimiento genera
entradas nuevas y se pierde la trazabilidad histórica del dispositivo.

### IV. Diagnóstico trazable

Toda operación de conexión, ejecución de comandos o diagnóstico DEBE registrar
trazabilidad suficiente para conocer:

* qué dispositivo fue intervenido;
* qué operación se ejecutó;
* cuándo se ejecutó;
* cuál fue el resultado.

Los diagnósticos DEBEN ser reproducibles y sus resultados DEBEN poder consultarse
posteriormente.

**Rationale**: La trazabilidad es la base para auditar intervenciones, reproducir
fallos y sustentar recomendaciones con evidencia verificable.

### V. Arquitectura modular y extensible

Las capacidades de descubrimiento, inventario, conexión, diagnóstico, persistencia,
topología y observabilidad DEBEN mantenerse desacopladas entre sí.

IDAF DEBE permitir incorporar nuevos fabricantes, tipos de dispositivos, protocolos,
collectors, mecanismos de conexión y motores de diagnóstico sin rediseñar el núcleo
del sistema. Estas extensiones DEBEN integrarse mediante interfaces o puntos de
extensión definidos, no mediante modificaciones al núcleo.

**Rationale**: La red y sus tecnologías evolucionan; un núcleo acoplado obligaría a
reescrituras costosas ante cada nueva plataforma soportada.

### VI. Independencia tecnológica y de fabricante

La lógica central de IDAF NO DEBE depender de un fabricante, sistema operativo o
tecnología de red específica. Las particularidades de cada plataforma DEBEN
encapsularse en componentes especializados (adaptadores, drivers o collectors)
detrás de contratos neutrales.

**Rationale**: Preserva la portabilidad del sistema y evita que decisiones de un
proveedor concreto condicionen la arquitectura completa.

### VII. Diagnóstico antes que modificación

IDAF DEBE priorizar la observación, la recolección de evidencias y el diagnóstico
antes de ejecutar cualquier acción correctiva. Una recomendación o diagnóstico
automático NO DEBE implicar ni desencadenar automáticamente una modificación sobre
la infraestructura; la aplicación de un cambio DEBE ser una decisión separada y
explícita.

**Rationale**: Separar el análisis de la acción reduce el riesgo de que un
diagnóstico erróneo se traduzca en un cambio perjudicial no supervisado.

### VIII. Seguridad de acceso

Las credenciales, secretos y datos sensibles usados para conectarse a dispositivos
NUNCA DEBEN almacenarse directamente en el código fuente ni exponerse en logs,
interfaces o resultados de diagnóstico. Los mecanismos de autenticación DEBEN poder
sustituirse sin modificar la lógica principal del sistema.

**Rationale**: La exposición de credenciales de infraestructura de red es un riesgo
crítico de seguridad; el desacople del mecanismo de autenticación permite adoptar
gestores de secretos sin refactorizar el núcleo.

### IX. Observabilidad como capacidad fundamental

IDAF DEBE conservar información suficiente sobre el estado de los dispositivos y
sobre la ejecución de sus propios componentes para permitir analizar fallos,
comportamiento y evolución de la red. La observabilidad DEBE formar parte de la
arquitectura del sistema y no ser únicamente una característica de presentación.

**Rationale**: Sin observabilidad estructural, los fallos del propio IDAF y de la
red observada resultan opacos y no diagnosticables después de ocurridos.

### X. Evolución hacia diagnóstico inteligente

La arquitectura de IDAF DEBE permitir evolucionar desde diagnósticos basados en
reglas hacia mecanismos de correlación, análisis y asistencia mediante inteligencia
artificial. La inteligencia artificial DEBE complementar las evidencias técnicas
obtenidas por el sistema; NUNCA DEBE sustituirlas, inventarlas ni presentar
conclusiones no respaldadas por evidencia recolectada.

**Rationale**: La IA aporta valor sólo si sus conclusiones son verificables contra
la evidencia; permitir que fabrique datos degradaría la confiabilidad del
diagnóstico.

### XI. Fuente de verdad consistente

El inventario administrado DEBE constituir la fuente de verdad operacional de los
dispositivos gestionados por IDAF. Las vistas de conexión, diagnóstico, topología y
observabilidad DEBEN consumir información consistente proveniente de dicha fuente y
NO DEBEN mantener inventarios independientes incompatibles entre sí.

**Rationale**: Múltiples inventarios divergentes producen decisiones contradictorias
y hacen imposible razonar de forma fiable sobre el estado de la red.

### XII. Integridad del sistema

Una funcionalidad nueva NO DEBE comprometer el comportamiento existente de
descubrimiento, inventario, conexión, diagnóstico o trazabilidad. Ante un conflicto,
la estabilidad del núcleo de IDAF tiene prioridad sobre la incorporación rápida de
nuevas capacidades.

**Rationale**: La confianza en IDAF depende de que sus capacidades base sigan
funcionando de forma predecible a medida que el sistema crece.

## Restricciones Adicionales

Estas restricciones operacionalizan los principios anteriores y son de cumplimiento
obligatorio:

* **Operaciones de escritura sobre dispositivos**: DEBEN estar deshabilitadas por
  defecto y requerir autorización explícita, además de generar un registro de
  auditoría (ver Principios I y VII).
* **Gestión de secretos**: las credenciales DEBEN obtenerse en tiempo de ejecución
  desde un proveedor de secretos externo o mecanismo equivalente; el repositorio
  NO DEBE contener secretos reales (ver Principio VIII).
* **Neutralidad del núcleo**: el código del núcleo NO DEBE importar bibliotecas
  específicas de un fabricante; dichas dependencias DEBEN residir únicamente en los
  componentes de adaptación (ver Principios V y VI).
* **Persistencia con historial**: el inventario administrado y los resultados de
  diagnóstico DEBEN persistirse conservando historial y auditoría consultables
  (ver Principios III, IV y XI).
* **Correlación de identidad**: todo collector o flujo de descubrimiento DEBE
  entregar datos suficientes para la correlación de identidad de dispositivos
  (ver Principio III).

## Flujo de Desarrollo y Puertas de Calidad

* Toda propuesta de cambio (PR o equivalente) DEBE verificar explícitamente su
  cumplimiento con los doce principios de esta constitución.
* Los cambios que afecten descubrimiento, inventario, conexión, diagnóstico o
  trazabilidad DEBEN incluir cobertura de regresión que demuestre la ausencia de
  retrocesos (ver Principio XII).
* Los nuevos fabricantes, tipos de dispositivo, protocolos, collectors, mecanismos
  de conexión o motores de diagnóstico DEBEN incorporarse como componentes aislados
  del núcleo, a través de los puntos de extensión definidos (ver Principios V y VI).
* La revisión de código DEBE rechazar cualquier cambio que introduzca secretos en
  el código fuente, logs o resultados de diagnóstico (ver Principio VIII).
* Las operaciones de diagnóstico incorporadas o modificadas DEBEN emitir registros
  de trazabilidad conforme al Principio IV.
* Las funcionalidades asistidas por IA DEBEN documentar qué evidencia técnica
  respalda cada conclusión que producen (ver Principio X).

## Governance

Esta constitución prevalece sobre cualquier otra práctica o convención del
proyecto. En caso de conflicto entre una decisión de diseño y estos principios,
prevalecen los principios.

**Procedimiento de enmienda**: toda modificación a esta constitución DEBE (1)
proponerse por escrito describiendo el cambio y su motivación, (2) ser revisada y
aprobada por los responsables del proyecto, y (3) incluir un plan de migración o de
impacto cuando altere comportamiento o expectativas existentes.

**Política de versionado** (versionado semántico de la constitución):

* **MAJOR**: eliminación o redefinición incompatible de un principio o de la
  gobernanza.
* **MINOR**: incorporación de un nuevo principio o sección, o expansión material de
  una guía existente.
* **PATCH**: aclaraciones, correcciones de redacción y refinamientos no semánticos.

**Revisión de cumplimiento**: el cumplimiento de esta constitución DEBE verificarse
en cada puerta del flujo de Spec Kit (`specify`, `plan`, `tasks`, `implement`) y en
la revisión de cada cambio. Las desviaciones DEBEN justificarse de forma explícita
y documentada o, en su defecto, corregirse antes de avanzar.

**Guía de desarrollo en tiempo de ejecución**: los agentes y colaboradores DEBEN
consultar este documento y los archivos de guía del proyecto (`.specify/memory/` y
la documentación de agentes) como referencia operativa.

**Version**: 1.0.0 | **Ratified**: 2026-09-05 | **Last Amended**: 2026-09-05
