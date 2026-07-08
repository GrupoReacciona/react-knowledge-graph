# Phase 1: Repo Scaffolding & Compliance Gates - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Establecer la base de monorepo (pnpm + Turborepo + TypeScript project references) y las guardas estructurales de arquitectura y compliance — regla ESLint que bloquea imports prohibidos por paquete, chequeo de licencias en CI, y atribución legal finalizada (`NOTICE.md`, `THIRD_PARTY_NOTICES.md`) — **antes** de que exista ningún código de features (`graph-core` es Fase 2, el visor es Fase 3). No se implementa lógica de negocio en esta fase; solo estructura, configuración y guardas verificables en CI.

</domain>

<decisions>
## Implementation Decisions

### Fijación del commit fuente en NOTICE.md

- **D-01:** `NOTICE.md` se fija al tag de release `v0.8.1` de `codebase-memory-mcp` (SHA `f0c9be19c5d74b84f418d807bfdce7b5d6a261ff`, publicado 2026-06-12), no al HEAD de `main`. Un tag etiquetado es más auditable/reproducible que un commit de una rama en movimiento.
- **D-02:** `NOTICE.md` incluye el texto **completo** de la licencia MIT original inline (no una referencia a archivo separado): `Copyright (c) 2025 DeusData` + texto MIT completo, verificado vía `gh api repos/DeusData/codebase-memory-mcp/contents/LICENSE` el 2026-07-08.
- **D-03:** El pin a `v0.8.1` **no es definitivo**: al llegar a Fase 3 (importación real del código), se debe re-verificar si existe un release más reciente de `codebase-memory-mcp` y, si lo hay, actualizar el pin (SHA + `NOTICE.md`) antes de copiar código. Fase 3 debe repetir la consulta a la API de GitHub, no asumir que `v0.8.1` sigue siendo el último release.
- **D-04:** La tabla "Key Decisions" de `PROJECT.md` se actualiza en esta fase para reflejar el SHA/tag exacto fijado (actualmente dice solo "confirmado vía GitHub API" sin SHA concreto).

### Alcance exacto de la regla ESLint `no-restricted-imports` por paquete

ADR 0003 solo prohíbe llamadas HTTP (`fetch`/`axios`/`useQuery`), no prohíbe React en sí — pero `react-knowledge-graph` sí necesita importar React porque es la capa pública de componentes. La regla de lint se especifica así, paquete por paquete:

- **D-05 (`graph-core`):** bloquea `react`, `react-dom`, `three`, `@react-three/*`, y `fetch`/`axios`/`useQuery` — debe permanecer 100% framework/backend-agnostic (docs/03-architecture.md).
- **D-06 (`react-knowledge-graph`):** bloquea `fetch`/`axios`/`useQuery` (ADR 0003) y el import directo de `three`/`@react-three/*` — el acceso a Three.js debe pasar siempre por `graph-renderer-three`, nunca directo desde la capa pública. **No** bloquea `react`/`react-dom` (uso legítimo).
- **D-07 (`graph-renderer-three`):** bloquea `fetch`/`axios`/`useQuery` (ADR 0003 aplica a toda la pila de renderizado, no solo a la capa pública). Sí permite `react`, `three`, `@react-three/*`.
- **D-08 (`packages/adapters/*`):** bloquea `react`, `react-dom`, `three`, `@react-three/*` — los adapters deben ser funciones puras de conversión sin efectos secundarios (docs/03-architecture.md), verificable por lint y no solo documentado.

Esto hace verificable el criterio de éxito #2 del roadmap ("Un PR que introduce un import de React/Three.js o una llamada a fetch/axios/useQuery... falla el lint en CI") de forma específica por paquete, en vez de una única regla genérica ambigua.

### Stubs de paquetes adapters (v2) y examples/*

INFRA-01/ROADMAP mencionan `packages/adapters/{codebase-memory,graphology,neo4j}` como parte de la estructura del monorepo, pero `graphology` y `neo4j` son requisitos v2 (Milestone 6, `ADAPT-02`/`ADAPT-03`, fuera de este tramo). Se decidió **no** crear stubs vacíos para ellos ahora (YAGNI):

- **D-09:** En Fase 1 solo se crea `packages/adapters/codebase-memory/` (necesario porque Fase 3 / VIEWER-01 depende de él para eventualmente construir el adapter real en v2). `graphology` y `neo4j` se crean cuando llegue Milestone 6, no antes.
- **D-10:** `packages/adapters/codebase-memory/` en Fase 1 contiene únicamente `package.json` + `tsconfig.json` (sin lógica, ni siquiera un stub de `fromCodebaseMemory()`) — consistente con que toda Fase 1 es scaffolding puro sin lógica de negocio en ningún paquete.
- **D-11:** `examples/*` se crea como skeleton de proyecto Vite (`package.json` + config mínima) en Fase 1, sin app funcional — se completará con datos mock reales en Fase 3 junto con el componente (VIEWER-02).
- **D-12:** Todos los `package.json` internos usan ya el scope `@gruporeacciona/...` (p. ej. `@gruporeacciona/graph-core`) desde Fase 1, para uso interno vía pnpm workspaces. Esto **no** equivale a publicación — la publicación pública real sigue bloqueada por aprobación interna de Reacciona (PUB-04, fuera de este tramo).

### Alcance del bloqueo de licencias en CI

RESEARCH.md confirmó que `pnpm licenses list` (mencionado en docs/08) no tiene flag de fail-on-violation — la CI debe usar `license-checker-rseidelsohn --failOn` con una lista SPDX explícita.

- **D-13:** El gate de CI solo hace **fallar el build** (`--failOn`) para licencias `GPL`/`AGPL`/`SSPL` (lista SPDX explícita, no un prefijo genérico que pueda capturar `LGPL-3.0` por error). Las licencias de "revisión manual" (`MPL-2.0`, `LGPL`, `EPL`) **no bloquean** la CI — se permite el build pero se emite un warning visible para que un humano revise el PR. Esto resuelve el punto que quedó diferido en la discusión inicial y que tanto RESEARCH.md como PATTERNS.md volvieron a señalar de forma independiente.

### Claude's Discretion

Ninguna — todas las preguntas presentadas fueron respondidas explícitamente por el usuario (no se usó la opción "decide tú" salvo la primera pregunta del área de commit fuente, donde el usuario eligió directamente `v0.8.1` en lugar de delegar).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Licencias y atribución
- `docs/08-licensing-compliance.md` — política de licencias permitidas/revisión manual/bloqueadas, archivos obligatorios (`LICENSE`, `NOTICE.md`, `THIRD_PARTY_NOTICES.md`, `SECURITY.md`), comandos de CI (`pnpm licenses list`, `pnpm audit`)
- `docs/06-extraction-plan.md` — Fase 0 (preparación: licencia, NOTICE.md, monorepo, CI mínimo) y checklist de extracción completo
- `NOTICE.md` — placeholder actual (línea 14 señala explícitamente que falta el SHA real); debe finalizarse en esta fase con el pin a `v0.8.1`

### Arquitectura y guardas de dependencia
- `docs/03-architecture.md` — estructura de paquetes, dirección de dependencias (`graph-core` sin React/Three.js), rol de cada paquete (`graph-renderer-three`, `react-knowledge-graph`, `adapters/*`)
- `docs/adr/0003-no-internal-fetching.md` — ADR que fundamenta el bloqueo de `fetch`/`axios`/`useQuery`; **no** prohíbe React
- `.planning/codebase/ARCHITECTURE.md` — mapeo de codebase con anti-patrones documentados (fetching interno, fuga de objetos Three.js, adapters importados desde el viewer)

### Requisitos y roadmap
- `.planning/REQUIREMENTS.md` — INFRA-01 a INFRA-07 (requisitos exactos de esta fase)
- `.planning/ROADMAP.md` — Fase 1: Goal y 5 criterios de éxito verificables
- `.planning/PROJECT.md` — Key Decisions table (a actualizar con D-04)

### Research y patrones
- `.planning/phases/01-repo-scaffolding-compliance-gates/01-RESEARCH.md` — versiones verificadas en vivo (pnpm 11.10.0, turbo 2.10.4, typescript 6.0.3, eslint 10.6.0, etc.), gaps mecánicos detectados (no-restricted-imports no bloquea `fetch()` global; `pnpm licenses list` no tiene fail-on-violation), secuenciación de tareas recomendada
- `.planning/phases/01-repo-scaffolding-compliance-gates/01-PATTERNS.md` — bloques de código sourced para cada archivo de configuración sin análogo en el repo (0 análogos exactos; repo greenfield)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Ninguno — el repositorio es actualmente solo documentación (`.planning/codebase/STACK.md`, `.planning/codebase/ARCHITECTURE.md`): no hay `src/`, no hay `tsconfig.json`, no hay configuración de build, lint ni CI. Todo lo que se construye en esta fase parte de cero.

### Established Patterns
- Ninguno implementado aún; los patrones a seguir son los **especificados** en `docs/03-architecture.md` (capas con dirección de dependencia estricta) y `docs/adr/*` (contratos vinculantes), no patrones observados en código existente.

### Integration Points
- N/A para esta fase — no hay componente ni lógica que integrar todavía. Los "puntos de integración" de esta fase son estructurales: workspaces de pnpm, project references de TypeScript, y pipelines de Turborepo/CI que conectarán los paquetes entre sí en fases posteriores.

</code_context>

<specifics>
## Specific Ideas

- Fuente de extracción verificada en vivo durante esta discusión vía `gh api`: `github.com/DeusData/codebase-memory-mcp`, tag `v0.8.1`, SHA `f0c9be19c5d74b84f418d807bfdce7b5d6a261ff`, copyright `(c) 2025 DeusData`, licencia MIT.
- El usuario prefiere reglas de lint específicas por paquete (no una única regla genérica) para que el criterio de éxito #2 del roadmap sea verificable de forma precisa.
- El usuario prefiere no crear estructura vacía especulativa (adapters de v2) — alineado con YAGNI del proyecto.

</specifics>

<deferred>
## Deferred Ideas

- **Stubs de `graphology`/`neo4j` adapters** — explícitamente diferidos a Milestone 6 (v2), fuera de este tramo (ver D-09).

### Reviewed Todos (not folded)
None — no había todos pendientes que coincidieran con el alcance de esta fase (`todo_count: 0`).

</deferred>

---

*Phase: 1-Repo Scaffolding & Compliance Gates*
*Context gathered: 2026-07-08*
