# Requirements Quality Checklist: Fundación funcional de IDAF (experiencia base y navegación)

**Purpose**: Formal release-gate review of the *quality* of the requirements in `spec.md` (completeness, clarity, consistency, measurability, coverage) before implementation of feature `001-idaf-foundation-navigation` proceeds. This checklist tests the requirements as written — it does not verify the implementation.
**Created**: 2026-09-05
**Reviewed**: 2026-09-05 (todos los ítems evaluados tras la pasada de correcciones H1/H2/M1–M5 + LOW)
**Feature**: [spec.md](../spec.md)
**Focus**: Overall requirements completeness — all quality dimensions
**Depth**: Formal release gate (mandatory gating on every dimension)
**Audience / Timing**: Reviewer, at PR time (before `/speckit-implement`)

**Review Ownership**: This custom checklist is a reviewer-owned requirements-quality review artifact. Mark an item `[x]` only when the reviewer determines the requirements-quality criterion is satisfied. `[x]` does **not** mean implementation work is complete.

**Estado de la puerta**: **CERRADA** — 40/40 ítems resueltos. No quedan `[ ]` pendientes.

## Requirement Completeness

- [x] CHK001 Is there a requirement covering what the application presents during the initial load, before the Home screen is shown? [Gap, Spec §FR-001]
  - ✅ FR-001 ampliado: durante la carga inicial no se muestran errores técnicos ni contenido que aparente funcionalidad. Assumptions añade que la carga es prácticamente instantánea (artefacto estático) y no se requiere pantalla de carga intermedia.
- [x] CHK002 Is the required content of the Home screen's list of areas fully specified — visible label, availability status, and whether each entry is itself a navigation control? [Completeness, Spec §FR-004, §FR-005]
  - ✅ FR-004 reescrito: la lista de Inicio es informativa (etiqueta + estado); la navegación se realiza mediante la navegación principal (FR-008/FR-009). FR-005 fija las dos etiquetas oficiales. `data-model.md` §"Filas de la lista de Inicio" = `{ label, statusText }`.
- [x] CHK003 Are requirements defined for how the currently active area is indicated within the primary navigation? [Gap]
  - ✅ Nuevo FR-029: el área activa se señala de forma perceptible (visible + expuesta a tecnologías de asistencia).
- [x] CHK004 Does the spec define the section-failure behavior (what "reintentar" restores, when "volver a Inicio" is offered) at a level a reviewer can confirm without implementation detail? [Completeness, Spec §FR-021]
  - ✅ FR-021 ampliado: "Reintentar" vuelve a intentar la ruta actual; si vuelve a fallar permanece el mensaje; "Volver a Inicio" siempre disponible. EC-04 lo repite en términos de comportamiento observable.
- [x] CHK005 Is the "reload while viewing a module" outcome captured as a requirement (user ends in a valid state with the primary navigation available), rather than only as an Edge Case bullet? [Gap, Spec §Edge Cases]
  - ✅ Nuevo FR-027 (recarga / acceso directo conserva el área y mantiene la navegación). US2 escenario 5 lo recoge como criterio de aceptación de la historia.
- [x] CHK006 Is the visible language / locale of all user-facing text stated as a requirement? [Gap]
  - ✅ Assumptions: "Toda la interfaz de usuario de esta spec se presenta en español; no hay internacionalización ni selección de idioma en el alcance."
- [x] CHK007 Are requirements defined for reaching an area by a direct or bookmarked destination (not only via in-app navigation from Home)? [Gap, Coverage]
  - ✅ FR-027 cubre explícitamente "acceso directo mediante URL" a una ruta válida; ruta desconocida → FR-022.
- [x] CHK008 Are requirements defined for the Home area list when the set of areas or their statuses cannot be determined (degraded / zero state)? [Edge Case, Gap]
  - ✅ Assumptions: la lista de las siete áreas y sus estados son constantes del producto, no provienen de ninguna fuente en tiempo de ejecución y "no existe un estado 'sin datos' para esa lista". Un fallo de render de la vista de Inicio cae bajo FR-021 / EC-04.

## Requirement Clarity

- [x] CHK009 Is "carga inicial" / "finaliza su carga inicial" defined with an observable completion condition? [Ambiguity, Spec §FR-001]
  - ✅ FR-001 + Assumptions: la condición observable es "se muestra la pantalla de Inicio"; la carga es prácticamente instantánea y sin estados intermedios especificados.
- [x] CHK010 Is "explicación breve del propósito" bounded enough to verify objectively (which concepts are mandatory, any length or placement constraint)? [Clarity, Spec §FR-003]
  - ✅ FR-003 ampliado: conceptos obligatorios (descubrimiento, gestión, diagnóstico, observabilidad + "dispositivos de red e IoT"); "breve" = uno o dos párrafos; ubicación = la pantalla de Inicio.
- [x] CHK011 Does "permanecer visible y utilizable durante el uso normal" define which states count as "uso normal", and whether the section-failure state is included or excluded? [Ambiguity, Spec §FR-008]
  - ✅ FR-008 ampliado: "uso normal" = todas las rutas válidas + la redirección desde ruta desconocida; en EC-04 la navegación principal permanece disponible salvo fallo del marco completo, en cuyo caso la vista de error ofrece "Volver a Inicio".
- [x] CHK012 Is "un solo paso de navegación" defined (single control activation? no intermediate screen? no pass-through Inicio?) for the success criteria that use it? [Clarity, Spec §SC-002, §SC-003]
  - ✅ Encabezado de §Success Criteria: "una única activación de un control de la navegación principal, sin pantallas intermedias y sin pasar por Inicio".
- [x] CHK013 Is "alternar rápidamente" / "navegación rápida" quantified or given a testable interpretation? [Ambiguity, Spec §FR-014, §Edge Cases]
  - ✅ FR-014 y EC-02: "al menos 20 alternancias consecutivas". El encabezado de §Success Criteria define "alternancia".
- [x] CHK014 Are "acciones que aparenten ejecutar una operación real" given classification criteria beyond the listed examples, so a reviewer can judge a borderline UI element? [Clarity, Spec §FR-017]
  - ✅ FR-017 ampliado: criterio de clasificación ("iniciar, ejecutar, analizar, escanear, conectar, guardar o modificar") + regla práctica (solo texto: sin `button`/`input`/`form`/`select`/enlaces de acción).
- [x] CHK015 Is "información técnica interna" defined (stack traces, error codes, version/build strings, internal identifiers)? [Ambiguity, Spec §FR-018, §FR-020]
  - ✅ FR-018 define el término (trazas, mensajes de excepción, códigos internos, identificadores técnicos, cadenas de versión/build, rutas de código); FR-020 remite a esa definición.
- [x] CHK016 Is "mensaje comprensible" given any acceptance criteria (target reader, absence of codes/jargon, presence of a next action)? [Clarity, Spec §FR-021, §FR-022]
  - ✅ FR-021 define "comprensible": redactado para el perfil redes/soporte, sin códigos ni jerga, con al menos una acción de salida. FR-022 exige redirección a Inicio sin errores crudos.
- [x] CHK017 Are "datos que aparenten representar dispositivos reales o simulados" distinguishable in the requirements from legitimate descriptive text about what each area will do? [Ambiguity, Spec §FR-019]
  - ✅ FR-019 ampliado: prohíbe listados/tablas/fichas/valores que representen instancias de dispositivos (host, IP, MAC, estados, métricas); permite explícitamente el texto descriptivo de cada área.
- [x] CHK018 Do FR-005 and User Story 1 scenario 3 draw the availability-status labels from a single, consistent set ("Disponible" / "No disponible")? [Consistency, Spec §FR-005, §US1]
  - ✅ M1 aplicado: "Próximamente" eliminado de FR-005, US1 escenario 3 y Key Entities. Etiquetas oficiales = {"Disponible", "No disponible"}. Coincide con `data-model.md`, `research.md` D5 y `contracts/module-registry.md` R5.
- [x] CHK019 Is the seven-area list identical in names and order everywhere it appears (Input, US1.3, FR-006, SC-001, Key Entities)? [Consistency, Spec §FR-006]
  - ✅ Verificado: Input, US1.3, FR-006, SC-001, Key Entities, `data-model.md`, `contracts/` — misma lista y orden (Inicio, Inventario, Descubrimiento, Conexiones, Diagnósticos, Topología, Observabilidad).
- [x] CHK020 Do FR-007 ("etiqueta única y consistente") and FR-025 ("terminología idéntica en Inicio y navegación") overlap without conflict and without leaving a case uncovered? [Consistency, Spec §FR-007, §FR-025]
  - ✅ Son capas complementarias: FR-007 = unicidad/consistencia global de cada capacidad; FR-025 = cadenas idénticas Inicio↔navegación. Ambas se satisfacen por la fuente única (`content/idaf.ts` → `registry.ts`). Sin conflicto ni hueco.
- [x] CHK021 Is "sin recargar ni reiniciar la aplicación" stated consistently across FR-011, US2 scenario 3, and SC-003? [Consistency, Spec §FR-011, §SC-003]
  - ✅ Redacción consistente en FR-011, US2 escenario 3 y SC-003 ("sin recargar la aplicación").
- [x] CHK022 Is FR-022 offering two acceptable outcomes for an unknown destination an intentional choice, and is it consistent with the Edge Cases wording? [Consistency, Spec §FR-022, §Edge Cases]
  - ✅ Decisión cerrada: FR-022 ahora exige **redirección a Inicio** (una sola salida), coherente con EC-05, `research.md` D8 y `contracts/navigation-and-routes.md` C6.
- [x] CHK023 Are all of User Story 3's negative conditions (not empty, not an error, no internal technical info, no fake actions) fully represented by FR-016–FR-018 with none dropped? [Consistency, Spec §US3, §FR-016, §FR-017, §FR-018]
  - ✅ Mapeo: mensaje explícito de pendiente = FR-016; sin acciones falsas = FR-017; ni vacío, ni error, ni información técnica interna = FR-018. Ninguna condición de US3 queda fuera.
- [x] CHK024 Is the requirement that user-facing errors never expose internal diagnostics consistent with Constitution Principle IX (technical detail belongs in logs, not the UI)? [Consistency, Spec §FR-020, Constitution §IX]
  - ✅ FR-020 + FR-018 alinean con el Principio IX; `plan.md` §Constitution Check IX lo confirma (detalles a `console.error`, no a la UI).

## Acceptance Criteria Quality & Measurability

- [x] CHK025 Can SC-005 be objectively measured — defined questions, pass threshold, starting condition, task, and does it trace to Home-screen content requirements (FR-002–FR-005)? [Measurability, Spec §SC-005]
  - ✅ M5 aplicado: SC-005 lista las cinco preguntas, fija el umbral ("las cinco correctas"), la condición inicial ("nunca ha usado IDAF"), la tarea ("usarla durante menos de 3 minutos") y traza a FR-002–FR-005. Marcado explícitamente **no bloqueante**.
- [x] CHK026 Is SC-006's "sesión de navegación normal" defined precisely enough to reproduce (which areas are visited, what counts as one alternation)? [Measurability, Spec §SC-006]
  - ✅ SC-006 (parte automatizada) = "recorra las siete áreas y realice al menos 20 alternancias"; el encabezado de §Success Criteria define "alternancia" = navegación de un área a otra distinta.
- [x] CHK027 Does SC-008 depend on an external "documento de origen (CA-01…CA-12)" that is not part of the spec? [Measurability, Dependency, Spec §SC-008]
  - ✅ M3 aplicado: los 12 criterios CA-01 … CA-12 están ahora en `spec.md` §"Criterios de aceptación (CA-01 … CA-12)". SC-008 referencia esa sección; la spec es autosuficiente.
- [x] CHK028 Are the FR-013 / FR-014 / SC-007 outcomes ("no errores", "no contenido duplicado", "continuar respondiendo") expressed as observable pass/fail conditions? [Measurability, Spec §FR-013, §FR-014, §SC-007]
  - ✅ FR-013 y SC-007: "consola sin errores" + "un solo encabezado de módulo en el DOM". FR-014: "una navegación posterior surte efecto" + "sin vistas acumuladas ni estados intermedios 'pegados'".
- [x] CHK029 Does every requirement FR-001–FR-031 have at least one corresponding acceptance scenario or success criterion? [Traceability, Coverage]
  - ✅ Trazabilidad en `plan.md` §Coverage review y `tasks.md` §Coverage review (FR-001 … FR-031). FR-023 tiene además comprobación positiva (no login en `/`, T019); FR-026 vía T024/T031; FR-027 vía US2 escenario 5 + EC-06; FR-028–FR-031 vía CA-04 y pruebas T018/T035.
- [x] CHK030 Is the "no full application reload / remains usable" expectation captured as a spec-level requirement, not only as a plan-level performance note? [Coverage, Gap]
  - ✅ FR-011 (sin recargar/reiniciar) + FR-027 (recarga conserva el área) + FR-008 (navegación utilizable). Ya no depende de la nota de rendimiento del plan.

## Scenario & Edge Case Coverage

- [x] CHK031 Are requirements defined for the section-load-failure recovery flow, including what a successful retry restores and what happens if the retry also fails? [Coverage, Exception Flow, Spec §FR-021]
  - ✅ FR-021 + EC-04: "Reintentar" reintenta la ruta actual; si vuelve a fallar permanece el mensaje de error; "Volver a Inicio" siempre disponible.
- [x] CHK032 Does the rapid-switching requirement cover the absence of residual / stuck intermediate views and the absence of accumulated views, not only "show the last selected area"? [Completeness, Spec §FR-014, §Edge Cases]
  - ✅ FR-014 y EC-02: "sin vistas acumuladas ni estados intermedios 'pegados'".
- [x] CHK033 Is each of the six pending modules individually covered by the "funcionalidad no disponible" requirement, rather than only addressed as a group? [Coverage, Spec §FR-015, §FR-016]
  - ✅ FR-015 nombra los seis módulos y exige "su propia vista"; `contracts/navigation-and-routes.md` (mapa de rutas) y `tasks.md` T009/T023 los tratan uno a uno.
- [x] CHK034 Does FR-019 ("no datos que aparenten dispositivos") explicitly apply to all seven areas, including Inicio? [Coverage, Spec §FR-019]
  - ✅ FR-019: "en ninguna de las siete áreas (incluida Inicio)".
- [x] CHK035 Is the "no persistence — every open starts at Inicio" behavior stated as a requirement (returning-user expectation), rather than only as an Assumption? [Coverage, Gap, Spec §Assumptions]
  - ✅ Assumptions lo detalla (sin `localStorage`/cookies; no se recuerda la última área) y lo reconcilia con FR-027; FR-011 cubre el regreso a Inicio en un paso.
- [x] CHK036 Are accessibility requirements specified for the interactive shell — keyboard operability, visible focus, and screen-reader labels for nav entries and availability status? [Gap, Accessibility]
  - ✅ M4 aplicado: FR-028 (teclado), FR-029 (área activa perceptible, visible + asistencia), FR-030 (nombres accesibles), FR-031 (foco visible). Out of Scope acota el alcance (sin WCAG completo).
- [x] CHK037 Is the desktop-only / viewport scope expressed as a bounded requirement, rather than only as an Assumption that "el soporte móvil no se especifica"? [Clarity, Spec §Assumptions]
  - ✅ Ahora es una exclusión explícita en Out of Scope ("Diseño responsive y soporte de viewports móviles o táctiles") además de la Assumption.
- [x] CHK038 Is the Assumption "no hay persistencia … cada apertura de la aplicación parte de la pantalla de Inicio" reconciled with the reload Edge Case? [Conflict, Spec §Assumptions, §Edge Cases]
  - ✅ H1 aplicado: Assumptions define "apertura" = acceder a `/`, y aclara que la ruta actual vive en la URL (no es estado persistido), por lo que FR-027 (recarga conserva el módulo) no la contradice.
- [x] CHK039 Is the Assumption "el texto exacto de los mensajes … puede ajustarse" bounded so it cannot weaken the verifiability of FR-002, FR-003, and FR-016? [Assumption, Spec §Assumptions]
  - ✅ La Assumption ahora exige conservar lo verificable de FR-002 (nombre "IDAF"), FR-003 (los cuatro conceptos + "red e IoT") y FR-016 (mención explícita de "no disponible" e incorporación futura).
- [x] CHK040 Is the Assumption "el estado de disponibilidad … es fijo … no se configura por el usuario" consistent with FR-005, with no requirement implying a user-configurable status? [Consistency, Spec §Assumptions, §FR-005]
  - ✅ Consistente: Assumptions ("constantes del producto, no se configuran por el usuario"), Key Entities ("solo Inicio es 'Disponible'") y `data-model.md` ("`status` constante"). Ningún FR implica configuración por el usuario.

## Notes

- Mark items `[x]` only after review confirms the requirement-quality criterion is satisfied.
- Leave items unchecked when they still require clarification, correction, or reviewer evaluation.
- `/speckit-implement` reads checklist checkbox state as a gate and must not modify markers.
- `checklists/requirements.md` is a separate built-in spec-quality checklist maintained by `/speckit-specify` and `/speckit-clarify`; this file (`requirements-quality.md`) is independent of it.
- Record findings inline beneath the relevant item.
- 2026-09-05: puerta cerrada tras aplicar H1 (FR-027 + reconciliación de Assumptions/EC-06), M1 (etiqueta única "No disponible"), M2 (criterios bloqueantes vs. no bloqueantes), M3 (CA-01…CA-12 incorporados), M4 (FR-028…FR-031), M5 (SC-005 con cinco preguntas y umbral) y los ajustes LOW asociados.
