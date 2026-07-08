# Phase 1: Repo Scaffolding & Compliance Gates - Research

**Researched:** 2026-07-08
**Domain:** pnpm/Turborepo monorepo scaffolding, TypeScript project references, ESLint architecture-boundary enforcement, OSS license compliance CI, legal attribution
**Confidence:** HIGH (tooling/config mechanics — verified via official docs and live npm registry queries) / MEDIUM (CI-gating exact semantics for the 3-tier license policy — see Open Questions)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Fijación del commit fuente en NOTICE.md**

- **D-01:** `NOTICE.md` se fija al tag de release `v0.8.1` de `codebase-memory-mcp` (SHA `f0c9be19c5d74b84f418d807bfdce7b5d6a261ff`, publicado 2026-06-12), no al HEAD de `main`. Un tag etiquetado es más auditable/reproducible que un commit de una rama en movimiento.
- **D-02:** `NOTICE.md` incluye el texto **completo** de la licencia MIT original inline (no una referencia a archivo separado): `Copyright (c) 2025 DeusData` + texto MIT completo, verificado vía `gh api repos/DeusData/codebase-memory-mcp/contents/LICENSE` el 2026-07-08.
- **D-03:** El pin a `v0.8.1` **no es definitivo**: al llegar a Fase 3 (importación real del código), se debe re-verificar si existe un release más reciente de `codebase-memory-mcp` y, si lo hay, actualizar el pin (SHA + `NOTICE.md`) antes de copiar código. Fase 3 debe repetir la consulta a la API de GitHub, no asumir que `v0.8.1` sigue siendo el último release.
- **D-04:** La tabla "Key Decisions" de `PROJECT.md` se actualiza en esta fase para reflejar el SHA/tag exacto fijado (actualmente dice solo "confirmado vía GitHub API" sin SHA concreto).

**Alcance exacto de la regla ESLint `no-restricted-imports` por paquete**

ADR 0003 solo prohíbe llamadas HTTP (`fetch`/`axios`/`useQuery`), no prohíbe React en sí — pero `react-knowledge-graph` sí necesita importar React porque es la capa pública de componentes. La regla de lint se especifica así, paquete por paquete:

- **D-05 (`graph-core`):** bloquea `react`, `react-dom`, `three`, `@react-three/*`, y `fetch`/`axios`/`useQuery` — debe permanecer 100% framework/backend-agnostic (docs/03-architecture.md).
- **D-06 (`react-knowledge-graph`):** bloquea `fetch`/`axios`/`useQuery` (ADR 0003) y el import directo de `three`/`@react-three/*` — el acceso a Three.js debe pasar siempre por `graph-renderer-three`, nunca directo desde la capa pública. **No** bloquea `react`/`react-dom` (uso legítimo).
- **D-07 (`graph-renderer-three`):** bloquea `fetch`/`axios`/`useQuery` (ADR 0003 aplica a toda la pila de renderizado, no solo a la capa pública). Sí permite `react`, `three`, `@react-three/*`.
- **D-08 (`packages/adapters/*`):** bloquea `react`, `react-dom`, `three`, `@react-three/*` — los adapters deben ser funciones puras de conversión sin efectos secundarios (docs/03-architecture.md), verificable por lint y no solo documentado.

Esto hace verificable el criterio de éxito #2 del roadmap ("Un PR que introduce un import de React/Three.js o una llamada a fetch/axios/useQuery... falla el lint en CI") de forma específica por paquete, en vez de una única regla genérica ambigua.

**Stubs de paquetes adapters (v2) y examples/***

INFRA-01/ROADMAP mencionan `packages/adapters/{codebase-memory,graphology,neo4j}` como parte de la estructura del monorepo, pero `graphology` y `neo4j` son requisitos v2 (Milestone 6, `ADAPT-02`/`ADAPT-03`, fuera de este tramo). Se decidió **no** crear stubs vacíos para ellos ahora (YAGNI):

- **D-09:** En Fase 1 solo se crea `packages/adapters/codebase-memory/` (necesario porque Fase 3 / VIEWER-01 depende de él para eventualmente construir el adapter real en v2). `graphology` y `neo4j` se crean cuando llegue Milestone 6, no antes.
- **D-10:** `packages/adapters/codebase-memory/` en Fase 1 contiene únicamente `package.json` + `tsconfig.json` (sin lógica, ni siquiera un stub de `fromCodebaseMemory()`) — consistente con que toda Fase 1 es scaffolding puro sin lógica de negocio en ningún paquete.
- **D-11:** `examples/*` se crea como skeleton de proyecto Vite (`package.json` + config mínima) en Fase 1, sin app funcional — se completará con datos mock reales en Fase 3 junto con el componente (VIEWER-02).
- **D-12:** Todos los `package.json` internos usan ya el scope `@gruporeacciona/...` (p. ej. `@gruporeacciona/graph-core`) desde Fase 1, para uso interno vía pnpm workspaces. Esto **no** equivale a publicación — la publicación pública real sigue bloqueada por aprobación interna de Reacciona (PUB-04, fuera de este tramo).

> **IMPORTANT — resolves a conflict in the source documents:** `ROADMAP.md`'s literal success-criterion #1 text lists `packages/adapters/{codebase-memory,graphology,neo4j}`, which appears to require all three adapters. **D-09 explicitly overrides this** — it is a later, more specific user decision. Do **not** create `packages/adapters/graphology/` or `packages/adapters/neo4j/` in Phase 1. Only `packages/adapters/codebase-memory/` should exist.

### Claude's Discretion

Ninguna — todas las preguntas presentadas fueron respondidas explícitamente por el usuario (no se usó la opción "decide tú" salvo la primera pregunta del área de commit fuente, donde el usuario eligió directamente `v0.8.1` en lugar de delegar).

### Deferred Ideas (OUT OF SCOPE)

- **Alcance del bloqueo de licencias en CI** (¿la CI debe bloquear también el nivel "revisión manual" — MPL/LGPL/EPL — o solo avisar?) — el usuario no seleccionó este tema para discusión. El planner/researcher debe usar el criterio por defecto de `docs/08-licensing-compliance.md`: bloquear solo GPL/AGPL/SSPL de forma estricta; MPL/LGPL/EPL requieren "revisión manual" (no hay instrucción explícita de bloqueo automático en CI para ese nivel). Si esto resulta ambiguo durante la implementación, escalar al usuario en vez de asumir. **This research proposes a concrete mechanism for this in "Common Pitfalls" and "Open Questions" below — it still needs explicit sign-off, it is not a substitute for escalation.**
- **Stubs de `graphology`/`neo4j` adapters** — explícitamente diferidos a Milestone 6 (v2), fuera de este tramo (ver D-09).

**Reviewed Todos (not folded):** None — no había todos pendientes que coincidieran con el alcance de esta fase (`todo_count: 0`).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Monorepo pnpm con `packages/graph-core`, `packages/graph-renderer-three`, `packages/react-knowledge-graph`, `packages/adapters/codebase-memory` (only — see D-09 override above), `examples/*` | `pnpm-workspace.yaml` glob patterns + workspace `catalog:` protocol (Standard Stack, Code Examples) |
| INFRA-02 | Turborepo + configuración de TypeScript compartida (project references) en todos los packages | Turborepo `tasks` schema (v2.x, not `pipeline`) + TS composite/solution-style tsconfig pattern (Architecture Patterns, Code Examples) |
| INFRA-03 | Regla de ESLint (`no-restricted-imports`) que bloquea imports de React/Three.js/backend (`fetch`/`axios`/`useQuery`) en `graph-core` y `react-knowledge-graph`, forzando ADR 0003 | ESLint flat-config per-directory scoping via `files` globs + **critical gap found:** `no-restricted-imports` cannot catch the global `fetch()` call — needs `no-restricted-globals` too (Common Pitfalls, Code Examples) |
| INFRA-04 | Chequeo de licencias en CI (`pnpm licenses list` o `license-checker-rseidelsohn`) wired antes de añadir cualquier dependencia real | **Critical gap found:** `pnpm licenses list` has no native CI-fail flag; `license-checker-rseidelsohn` (verified OK, BSD-3-Clause) has `--onlyAllow`/`--failOn` with real exit codes (Standard Stack, Common Pitfalls, Code Examples) |
| INFRA-05 | `NOTICE.md` finalizado con el SHA de commit real, copyright y texto de licencia de `codebase-memory-mcp` | Content-only task; D-01/D-02 already supply the exact SHA/copyright/license text needed — no further research required beyond conventions (see "NOTICE.md / THIRD_PARTY_NOTICES.md conventions" in Architecture Patterns) |
| INFRA-06 | `THIRD_PARTY_NOTICES.md` creado | `generate-license-file` / `license-checker-rseidelsohn --files` for automated generation from the real dependency tree (Standard Stack, Don't Hand-Roll) |
| INFRA-07 | `peerDependencies` (`react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`) declaradas correctamente en todos los packages consumidores, evitando instancias duplicadas | `pnpm add --save-peer` (verified CLI mechanism, writes to both `peerDependencies` and `devDependencies`) + pnpm workspace `catalog:` protocol for version consistency (Code Examples) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Extracted directives from `./.claude/CLAUDE.md` that this phase's scaffolding must satisfy or make structurally enforceable:

- **Dependency direction (mandatory):** `graph-core` must have **zero** dependency on React or Three.js. `graph-renderer-three` may depend on `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`. `react-knowledge-graph` owns the public component/hooks/events/theming. `adapters/*` must never be imported by `react-knowledge-graph`.
- **No internal fetching (mandatory, ADR 0003):** `KnowledgeGraphViewer` must never make HTTP calls or accept a URL/endpoint prop — this is the exact rule INFRA-03 must make CI-enforceable, not just documented.
- **No MCP/backend coupling (mandatory):** the React package must not reference MCP, SQLite, ASTs, or Git repositories directly.
- **License policy:** MIT/BSD-2-Clause/BSD-3-Clause/ISC/Apache-2.0 allowed by default; MPL-2.0/LGPL/EPL require manual review; GPL/AGPL/SSPL/non-commercial/field-of-use-restricted licenses are blocked absent explicit approval. This is the exact 3-tier policy INFRA-04's CI gate must implement.
- **License provenance:** any code ported from `codebase-memory-mcp` (MIT) must land in a clearly separated commit for traceability and must preserve MIT attribution in `NOTICE.md`. (Applies fully starting Phase 3; Phase 1 only prepares `NOTICE.md` content — no code is copied yet.)
- **Naming:** kebab-case scoped npm packages (`graph-core`, `graph-renderer-three`, `react-knowledge-graph`, `adapters/codebase-memory`); public package name `@gruporeacciona/react-knowledge-graph`; all internal `package.json` names use the `@gruporeacciona/...` scope (D-12).
- **Publication approval:** no public release or npm publish under `@gruporeacciona` without prior internal Reacciona approval — not relevant to Phase 1's CI/scaffolding work itself (nothing is published), but worth keeping the CI workflow scoped to `pnpm install`/lint/typecheck/license-check, with no `npm publish` step.
- **Global state:** none exists yet; not directly applicable to scaffolding, but confirms no singleton/shared-state config should be introduced at this stage.

## Summary

This phase has no application logic — it is 100% build-tooling, dependency-boundary enforcement, and legal-compliance scaffolding. The four sub-domains (monorepo tooling, TypeScript project references, ESLint architecture guards, license-compliance CI) are all mature, well-documented, low-risk territory with one recurring theme: **the roadmap's plain-language success criteria ("blocks a bad import," "blocks a bad license") each hide a specific mechanical gap that a naive implementation will miss.** Two are significant enough to change how the planner should scope tasks:

1. **`no-restricted-imports` alone cannot catch a bare `fetch(...)` call.** `fetch` is a global function in Node 18+/browsers, not a module import — ESLint's `no-restricted-imports` only inspects `import`/`require` statements. Catching `axios` and `useQuery` (always explicit imports) works fine with `no-restricted-imports`; catching `fetch` requires the separate `no-restricted-globals` rule. Without it, success criterion #2 silently half-fails: a PR that adds `fetch('/api/graph')` inside `graph-core` would pass lint clean.
2. **`pnpm licenses list` (the tool `docs/08-licensing-compliance.md` names first) cannot fail a CI build on its own** — it only lists license data (confirmed via its own CLI reference: only `--json`, `--long`, `--dev` options, no allow/deny list or exit-code-on-violation flag exists). Achieving an actual blocking gate (success criterion #3) requires a tool with real exit-code semantics: `license-checker-rseidelsohn` (verified legitimate, BSD-3-Clause, actively maintained fork) has `--onlyAllow`/`--failOn` for exactly this.

**Primary recommendation:** Use pnpm workspaces + Turborepo (both already effectively locked in by INFRA-01/02) with TypeScript project references via a shared `tsconfig.base.json` + solution-style root `tsconfig.json`; enforce the per-package import boundaries (D-05 through D-08) with ESLint flat config `no-restricted-imports` **plus** `no-restricted-globals` for `fetch`; gate CI license compliance with `license-checker-rseidelsohn --failOn` using an explicit enumerated SPDX blocklist (not a bare `--onlyAllow`, which would incorrectly also block the "manual review" tier); and sequence the actual implementation as **vertical per-package slices**, not horizontal layers (see "Recommended Task Sequencing" below) — this matches both the project's own dependency direction and the phase's MVP framing (no Walking Skeleton; independently verifiable package-by-package slices instead).

## Architectural Responsibility Map

> **Adaptation note:** the standard tier vocabulary (Browser/Client, Frontend Server/SSR, API/Backend, CDN/Static, Database/Storage) describes a *running web application*. Phase 1 produces zero runtime code — every capability below is build-time/repo tooling. The table substitutes this project's own architectural layers (per `docs/03-architecture.md`) where "tier" would otherwise be meaningless, and flags the one capability that already encodes a *future* runtime-tier boundary.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Monorepo workspace + task orchestration (pnpm + Turborepo) | Repo tooling (root) | — | Cross-cutting build infrastructure owned at repo root, not by any single package |
| TypeScript project references / shared compiler config | Repo tooling (root: `tsconfig.base.json`) | Every package (`tsconfig.json` extends base) | Base config is root-owned; each package's own composite config is package-owned — deliberate shared ownership |
| Architecture-boundary enforcement (ESLint `no-restricted-imports` / `no-restricted-globals`) | Repo tooling (root `eslint.config.js`) | Each package via `files` glob scoping (`graph-core`, `react-knowledge-graph`, `graph-renderer-three`, `adapters/*`) | One physical config file, but the boundary it enforces is the future **Browser/Client** rendering layer (`react-knowledge-graph`, `graph-renderer-three`) vs. the framework-agnostic core (`graph-core`, `adapters/*`) |
| License compliance gate (CI) | Repo tooling (CI workflow) | — | Applies to the whole dependency tree; not owned by any single package |
| Legal attribution (`NOTICE.md`, `THIRD_PARTY_NOTICES.md`) | Repo tooling (repo-root docs) | — | Repo-level legal artifacts, not a runtime concern |
| `peerDependencies` contract for React/Three.js | `react-knowledge-graph` + `graph-renderer-three` (future **Browser/Client** tier) | — | These are the only two packages that will ever execute in a browser; `graph-core` and `adapters/*` must stay zero-UI. This is the one row with genuine runtime-tier meaning — it encodes today the same boundary Phase 3's actual component will live inside. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pnpm` | 11.10.0 `[VERIFIED: npm registry, 2026-07-08]` | Package manager, workspace linking, license auditing (`pnpm licenses list`) | Matches `docs/03-architecture.md`'s `packages/*` layout; strict non-hoisted `node_modules` makes phantom/illegal cross-package imports fail loudly — valuable given the hard dependency-direction rules in this phase. Requires Node `>=22.13` `[VERIFIED: npm registry]` — this is the binding floor for the monorepo's `engines` field (highest requirement among the whole toolchain; see Common Pitfalls). |
| `turbo` (Turborepo) | 2.10.4 `[VERIFIED: npm registry, 2026-07-08]` | Task orchestration/caching (`build`, `lint`, `typecheck`) across packages | `turbo.json` uses the `tasks` key (not `pipeline` — that was Turbo v1 syntax) `[CITED: Context7 /vercel/turborepo]`. Confirmed via Turborepo's own source: **a package missing a given script is silently skipped, not an error** `[CITED: Context7 /vercel/turborepo, turborepo-task-executor source]` — this is exactly what makes stub-only packages (D-10's `adapters/codebase-memory`, no `build` logic yet) safe under `turbo run build`. |
| `typescript` | 6.0.3 `[VERIFIED: npm registry, 2026-07-08]` | Project references / composite builds across packages | Node `>=14.17` `[VERIFIED: npm registry]`. Use `tsconfig.base.json` + per-package `tsconfig.json` (`composite: true`) + a root **solution-style** `tsconfig.json` (`"files": []`, `"references": [...]`) `[CITED: Context7 /microsoft/typescript-website]`. |
| `eslint` | 10.6.0 `[VERIFIED: npm registry, 2026-07-08]` | Flat config; `no-restricted-imports` + `no-restricted-globals` for the architecture guard | Requires Node `^20.19.0 \|\| ^22.13.0 \|\| >=24` `[VERIFIED: npm registry]`. Flat config `files` globs give exact per-package rule scoping needed for D-05..D-08 `[CITED: Context7 /eslint/eslint]`. |
| `typescript-eslint` | 8.63.0 `[VERIFIED: npm registry, 2026-07-08]` | Typed linting across the monorepo | Requires Node `^18.18.0 \|\| ^20.9.0 \|\| >=21.1.0` `[VERIFIED: npm registry]`. v8+ ships `parserOptions.projectService`, which auto-discovers each file's tsconfig with **no manually-maintained glob array** `[CITED: Context7 /typescript-eslint/typescript-eslint]` — see Common Pitfalls for why the older glob-array approach is a specific hazard in *this* repo's directory shape. |
| `license-checker-rseidelsohn` | 5.0.1, BSD-3-Clause, no postinstall script `[VERIFIED: npm registry + package-legitimacy=OK, 2026-07-08]` | CI license gate — the tool that actually implements INFRA-04's "blocks a bad license" requirement | `--onlyAllow "<list>"` and `--failOn "<list>"` both exit code 1 on violation `[CITED: github.com/RSeidelsohn/license-checker-rseidelsohn]`; `pnpm licenses list` (docs/08's first-named tool) has no equivalent flag (see Common Pitfalls). Actively maintained fork of the abandoned original `license-checker`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `generate-license-file` | 4.2.1, ISC `[VERIFIED: npm registry + package-legitimacy=OK]` | Auto-generate `THIRD_PARTY_NOTICES.md` content from the real installed dependency tree | INFRA-06 — run after real dependencies exist (post react/three install), commit the generated output rather than hand-curating it |
| `react`, `react-dom` | 19.2.7 `[VERIFIED: npm registry]`, MIT | `peerDependencies` contract for `react-knowledge-graph` | Declared via `pnpm add --save-peer` (writes to both `peerDependencies` and `devDependencies` in one command `[CITED: Context7 /websites/pnpm_io]`) |
| `three` | 0.185.1 `[VERIFIED: npm registry]`, MIT | `peerDependencies` contract for `graph-renderer-three` | Same mechanism as above |
| `@react-three/fiber` | 9.6.1, MIT. Own peer range: `react`/`react-dom` `>=19 <19.3`, `three >=0.156` `[VERIFIED: npm registry]` | `peerDependencies` contract for `graph-renderer-three` | Verify this range again before any future React major bump — fiber's upper bound is explicit |
| `@react-three/drei` | 10.7.7, MIT. Own peer range: `react`/`react-dom` `^19`, `three >=0.159`, `@react-three/fiber ^9.0.0` `[VERIFIED: npm registry]` | `peerDependencies` contract for `graph-renderer-three` | Current pinned `three@0.185.1` satisfies both fiber's and drei's floor |
| `dependency-cruiser` | 18.0.0, MIT, optional `[VERIFIED: npm registry, package-legitimacy=SUS/too-new]` | Richer architecture-boundary validation (circular deps, orphan modules) if ESLint rules prove insufficient later | Not needed for D-05..D-08 (ESLint covers the stated need exactly); keep in back pocket, don't install now (YAGNI) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ESLint `no-restricted-imports`/`no-restricted-globals` | `dependency-cruiser` | Richer graph analysis (circular deps, orphan detection, "is this module shared enough") and works independently of ESLint, but only surfaces violations on a CI/CLI run — no in-editor red-squiggle feedback the way ESLint gives `[CITED: web synthesis]`. Keep ESLint as primary per D-05..D-08; revisit only if circular-dependency detection becomes a real need. |
| `license-checker-rseidelsohn` | `pnpm licenses list` + custom parsing script | `pnpm licenses list` needs zero extra devDependency and is docs/08's first-named tool, but has no allow/deny-list flag — the tiered policy logic would have to be hand-rolled in a shell/Node script against its `--json` output. `license-checker-rseidelsohn` already implements exactly this need with tested exit-code semantics — less code to maintain and review. |
| `license-checker-rseidelsohn --onlyAllow` (allow-list) | `license-checker-rseidelsohn --failOn` (deny-list) | An allow-list fails closed on anything unrecognized (safer for *unknown* SPDX identifiers) but **must include MPL-2.0/LGPL/EPL in the allow list too** if those should only warn, not block — otherwise it silently collapses the user's 3-tier policy into 2 tiers (blocked ⟷ everything else). A deny-list (`--failOn` with an explicit enumerated GPL/AGPL/SSPL SPDX list) cleanly preserves the "manual review, don't block" middle tier, matching CONTEXT.md's deferred decision. **Recommend `--failOn` with an exhaustive enumerated blocklist**, not `--onlyAllow`, given the explicit 3-tier requirement (see Open Questions for the enumeration itself). |
| `pnpm --recursive` task loops | Turborepo (already required by INFRA-02) | A naive `pnpm --recursive run build` rebuilds every package on every run; acceptable at today's ~5 packages but doesn't scale as adapters/examples grow (Milestone 6+). Turborepo's dependency-graph-aware caching is explicitly required by INFRA-02 already — no actual alternative decision needed here, listed for completeness. |

**Installation:**

```bash
# Pin and activate the exact pnpm version via Corepack (no global pnpm install assumed —
# verified locally: Corepack resolves pnpm on demand from the "packageManager" field)
corepack enable
corepack use pnpm@11.10.0

# Root workspace devDependencies
pnpm add -D -w turbo typescript eslint typescript-eslint license-checker-rseidelsohn generate-license-file

# Per consuming package, once its package.json exists (writes peerDependencies + devDependencies together):
pnpm --filter @gruporeacciona/graph-renderer-three add --save-peer react react-dom three @react-three/fiber @react-three/drei
pnpm --filter @gruporeacciona/react-knowledge-graph add --save-peer react react-dom three @react-three/fiber @react-three/drei
```

**Version verification:** All versions above were confirmed live against the npm registry on 2026-07-08 via `npm view <pkg> version`, cross-checked against the project's own same-day `.planning/research/STACK.md` (independently produced, matches exactly on every shared package). `npm view <pkg> engines` was also queried directly for `pnpm`, `typescript`, `eslint`, and `typescript-eslint` to determine the monorepo's Node floor (see Common Pitfalls).

## Package Legitimacy Audit

Ran `gsd-tools query package-legitimacy check` against every package this phase installs or references, plus a postinstall-script scan (`npm view <pkg> scripts.postinstall`) for supply-chain hygiene.

| Package | Registry | Age (latest version) | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----------------------|-------------------|--------------|---------|-------------|
| `pnpm` | npm | published 2026-07-04 (4 days old) | 117,122,186 | github.com/pnpm/pnpm | `[SUS]` (`too-new`) | Approved — see note below |
| `turbo` | npm | published 2026-07-06 (2 days old) | 16,296,787 | github.com/vercel/turborepo | `[SUS]` (`too-new`) | Approved — see note below |
| `typescript` | npm | published 2026-04-16 | 211,510,203 | github.com/microsoft/TypeScript | `[OK]` | Approved |
| `eslint` | npm | published 2026-06-26 (12 days old) | 134,639,235 | github.com/eslint/eslint | `[SUS]` (`too-new`) | Approved — see note below |
| `typescript-eslint` | npm | published 2026-07-06 (2 days old) | 75,901,430 | github.com/typescript-eslint/typescript-eslint | `[SUS]` (`too-new`) | Approved — see note below |
| `license-checker-rseidelsohn` | npm | published 2026-05-27 | 348,019 | github.com/RSeidelsohn/license-checker-rseidelsohn | `[OK]` | Approved |
| `generate-license-file` | npm | published 2026-05-21 | 60,889 | github.com/TobyAndToby/generate-license-file | `[OK]` | Approved |
| `dependency-cruiser` | npm | published 2026-06-25 (13 days old) | 2,445,426 | github.com/sverweij/dependency-cruiser | `[SUS]` (`too-new`) | Not installed (optional/deferred, YAGNI) |
| `react` / `react-dom` | npm | published 2026-06-01 | 141,560,512 / 133,616,855 | github.com/facebook/react | `[OK]` | Approved |
| `three` | npm | published 2026-07-01 (7 days old) | 11,112,826 | github.com/mrdoob/three.js | `[SUS]` (`too-new`) | Approved — see note below |
| `@react-three/fiber` | npm | published 2026-04-28 | 3,795,851 | github.com/pmndrs/react-three-fiber | `[OK]` | Approved |
| `@react-three/drei` | npm | published 2025-11-13 | 2,857,015 | github.com/pmndrs/drei | `[OK]` | Approved |

**Note on `[SUS]`/`too-new` verdicts (`pnpm`, `turbo`, `eslint`, `typescript-eslint`, `three`):** every one of these flags is triggered solely by the *specific version's* publish date being within the last ~2 weeks of the research date — not by low adoption or a missing source repo. All five have tens-to-hundreds-of-millions of weekly downloads and long-established, verifiable GitHub repositories under their well-known maintaining orgs (pnpm, vercel, eslint, typescript-eslint, mrdoob). This reads as an artifact of these projects' fast, frequent release cadence, not a legitimacy concern. **Per the Package Legitimacy Gate protocol, they are kept (not removed) but flagged: the planner must add a `checkpoint:human-verify` task before pinning these exact versions**, primarily so a human confirms no last-minute registry anomaly (e.g., a compromised maintainer account publishing a malicious patch) rather than because the package identity itself is in doubt. If that verification is inconvenient at execution time, pinning one minor/patch version behind the verified-latest is a reasonable, low-risk fallback.

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** `pnpm`, `turbo`, `eslint`, `typescript-eslint`, `three` (all `too-new` only, see note above); `dependency-cruiser` also flagged but not installed this phase.

**Postinstall script scan:** `license-checker-rseidelsohn`, `dependency-cruiser`, `generate-license-file`, and `turbo` all report **no `postinstall` script** `[VERIFIED: npm registry]` — no arbitrary-code-execution-on-install risk from these packages.

## Architecture Patterns

### System Architecture Diagram

This phase has no runtime application; the "system" is the build/CI pipeline itself.

```text
Developer machine                         GitHub (CI)
──────────────────                        ───────────
git commit / push  ──────────────────────▶ pull_request / push to main
                                                   │
pnpm install                                       ▼
  │                                    actions/checkout
  ├─ reads pnpm-workspace.yaml                     │
  ├─ resolves workspace: links          pnpm/action-setup + actions/setup-node
  │  (graph-core ⇄ graph-renderer-three            │  (cache: 'pnpm')
  │   ⇄ react-knowledge-graph ⇄ adapters)          ▼
  ├─ resolves catalog: entries          pnpm install --frozen-lockfile
  │  (react/react-dom/three/            (Security by Default: postinstall/
  │   @react-three/* pinned once)        preinstall scripts blocked unless
  └─ Node engines check (>=22.13)        explicitly allow-listed — see
                                          Security Domain)
turbo run build/lint/typecheck                     │
  │                                                 ▼
  ├─ reads turbo.json "tasks"           turbo run build lint typecheck
  ├─ builds per-package task graph                  │
  │  via workspace deps (^build)          ┌─────────┼──────────┐
  ├─ SKIPS packages with no matching      ▼         ▼          ▼
  │  script (e.g. stub-only adapters,   graph-core  graph-     react-
  │  confirmed via Turborepo source)    (tsc build) renderer-  knowledge-
  └─ tsc --build (project references,               three     graph
     composite: true, per-package                  (tsc)      (tsc)
     tsconfig.json extends base)                     │          │
                                                      ▼          ▼
                                          eslint.config.js (flat config)
                                          per-package no-restricted-imports
                                          + no-restricted-globals(fetch)
                                          scoped by `files` glob (D-05..D-08)
                                                      │
                                                      ▼
                                          license-checker-rseidelsohn
                                          --failOn "<GPL/AGPL/SSPL SPDX list>"
                                          (exit 1 on violation → blocks merge)
                                                      │
                                          ┌───────────┴────────────┐
                                          ▼                        ▼
                                    any step fails            all green
                                    → PR blocked              → mergeable
                                   (success criteria           (success
                                    #1-#3 enforced)             criteria met)
```

### Recommended Project Structure

```text
react-knowledge-graph/                       # monorepo root
├── pnpm-workspace.yaml                      # packages/* + packages/adapters/* + examples/*, catalog: entries
├── package.json                             # workspace root: private, devDependencies, "packageManager": "pnpm@11.10.0"
├── tsconfig.base.json                       # shared strict compiler options
├── tsconfig.json                            # solution-style: "files": [], "references": [...]
├── eslint.config.js                         # flat config; root rules + D-05..D-08 per-package overrides
├── turbo.json                               # "tasks": { build, lint, typecheck, (test — see Open Questions) }
├── .github/workflows/ci.yml                 # install → turbo run → license-checker-rseidelsohn
├── LICENSE                                  # already exists (MIT)
├── NOTICE.md                                # finalized this phase (D-01/D-02), no placeholders
├── THIRD_PARTY_NOTICES.md                   # created this phase (generate-license-file output)
├── SECURITY.md                              # already exists
├── docs/, docs/adr/                         # already exist — unchanged
├── packages/
│   ├── graph-core/
│   │   ├── package.json                    # @gruporeacciona/graph-core, zero UI deps
│   │   └── tsconfig.json                   # extends ../../tsconfig.base.json, no "jsx"
│   ├── graph-renderer-three/
│   │   ├── package.json                    # peerDeps: react/react-dom/three/@react-three/*
│   │   └── tsconfig.json                   # extends base, "jsx": "react-jsx", references graph-core
│   ├── react-knowledge-graph/
│   │   ├── package.json                    # peerDeps: react/react-dom/three/@react-three/*
│   │   └── tsconfig.json                   # extends base, "jsx": "react-jsx", references graph-core + graph-renderer-three
│   └── adapters/
│       └── codebase-memory/                # ONLY this one — D-09 (graphology/neo4j deferred to Milestone 6)
│           ├── package.json                # zero UI deps, references graph-core (types only)
│           └── tsconfig.json               # extends base
└── examples/
    └── basic-usage/ (or similar)           # Vite skeleton per D-11 — package.json + minimal vite config, no app logic yet
```

### Recommended Task Sequencing (Vertical Slices)

Per the phase framing note, this is **not** a Walking Skeleton (no DB, no UI) — sequence Phase 1 as independently-verifiable per-package slices, not horizontal layers ("all package.jsons, then all tsconfigs, then all CI"):

**Slice 0 — Shared foundation (must exist before any per-package slice is verifiable):**
`pnpm-workspace.yaml`, root `package.json` (with `packageManager`/`engines`), `tsconfig.base.json`, root solution `tsconfig.json` (empty `references: []` initially), `turbo.json` (task shapes defined even before packages exist — Turborepo's confirmed skip-on-missing-script behavior means this is safe), root `eslint.config.js` (base recommended config only, no per-package overrides yet), `.github/workflows/ci.yml` skeleton. Verify: `pnpm install` succeeds trivially (zero workspace packages yet).

**Slice 1 — `graph-core`:** create `package.json` + `tsconfig.json`, add to root solution `tsconfig.json` references, add graph-core's D-05 ESLint override block. Verify per-package: `pnpm install`, `turbo run build --filter=@gruporeacciona/graph-core` succeeds; add a throwaway `import 'react'` line to confirm lint fails, then remove it (proves the guard works before relying on it).

**Slice 2 — `graph-renderer-three`:** same pattern, D-07 rule, add `react`/`react-dom`/`three`/`@react-three/fiber`/`@react-three/drei` via `pnpm add --save-peer` (+ migrate to `catalog:` protocol), reference `graph-core` in its `tsconfig.json`.

**Slice 3 — `react-knowledge-graph`:** same pattern, D-06 rule, same peer dependency set, reference `graph-core` + `graph-renderer-three`.

**Slice 4 — `packages/adapters/codebase-memory`:** D-08 rule, D-10 (package.json + tsconfig.json only, zero logic — do **not** add a `build` script with nothing to build; Turborepo will simply skip it).

**Slice 5 — `examples/*` skeleton:** D-11 Vite skeleton; install `react-knowledge-graph` as a real workspace dependency here to prove INFRA-07 end-to-end (success criterion #5 — no duplicate React/Three instances). This is the integration-proof slice and naturally comes last since it depends on every package above existing.

**Slice 6 — Compliance:** finalize `NOTICE.md` (D-01/D-02, can actually happen any time — no package dependency), generate `THIRD_PARTY_NOTICES.md` (best done *after* Slice 2/3 so there are real dependencies to enumerate, not an empty file), wire the `license-checker-rseidelsohn` CI step, update `PROJECT.md`'s Key Decisions table (D-04).

**Slice 7 — Full CI verification:** all 5 roadmap success criteria verified end-to-end in one clean run.

### Pattern 1: pnpm Workspace Catalogs for Cross-Package Version Consistency

**What:** A `catalog:` (default) or named `catalogs:` block in `pnpm-workspace.yaml` defines reusable version-range constants; packages reference them via the `catalog:` protocol instead of hardcoding a version string.
**When to use:** For every dependency shared across 2+ packages — here, specifically `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei` — to guarantee `graph-renderer-three` and `react-knowledge-graph` never drift onto different peer-dependency versions (which is the exact mechanism that causes duplicate React/Three instances).
**Example:**
```yaml
# Source: https://pnpm.io/pnpm-workspace_yaml, https://pnpm.io/catalogs (Context7 /websites/pnpm_io)
packages:
  - 'packages/*'
  - 'packages/adapters/*'
  - 'examples/*'

catalog:
  react: ^19.2.7
  react-dom: ^19.2.7
  three: ^0.185.1
  '@react-three/fiber': ^9.6.1
  '@react-three/drei': ^10.7.7
```
```json
// packages/graph-renderer-three/package.json
{
  "peerDependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "three": "catalog:",
    "@react-three/fiber": "catalog:",
    "@react-three/drei": "catalog:"
  }
}
```

### Pattern 2: TypeScript Solution-Style Root Config + Composite Project References

**What:** The root `tsconfig.json` declares no files of its own (`"files": []`) and only references each package's own composite config; each package's `tsconfig.json` extends a shared `tsconfig.base.json`.
**When to use:** Any monorepo where multiple packages must share one compiler-options source of truth without circular coupling, and editors/CI need fast incremental builds (`tsc --build`).
**Example:**
```json
// Source: TypeScript 5.7/3.9 release notes (Context7 /microsoft/typescript-website)
// tsconfig.json (root, solution-style)
{
  "files": [],
  "references": [
    { "path": "./packages/graph-core" },
    { "path": "./packages/graph-renderer-three" },
    { "path": "./packages/react-knowledge-graph" },
    { "path": "./packages/adapters/codebase-memory" }
  ]
}
```
```json
// packages/graph-core/tsconfig.json — no "jsx", zero UI deps
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src", "tsBuildInfoFile": "./dist/.tsbuildinfo" },
  "include": ["src"]
}
```
```json
// packages/react-knowledge-graph/tsconfig.json — needs jsx + references graph-core/graph-renderer-three
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx", "outDir": "./dist", "rootDir": "./src", "tsBuildInfoFile": "./dist/.tsbuildinfo" },
  "include": ["src"],
  "references": [{ "path": "../graph-core" }, { "path": "../graph-renderer-three" }]
}
```
Use TS 5.5+'s `${configDir}` variable in `tsconfig.base.json` if any path needs to be relative to the *extending* package rather than the base file `[CITED: Context7 /microsoft/typescript-website, TS 5.5 release notes]`.

### Pattern 3: Per-Package ESLint Flat-Config Scoping via `files` Globs

**What:** One physical `eslint.config.js` at the root; each package gets its own config object scoped with `files: ['packages/<name>/**/*.{ts,tsx}']`.
**When to use:** Exactly this phase's need — D-05 through D-08 require four *different* rule sets for four different directories, in one enforceable place.
**Example:** see Code Examples below (full listing).

### Anti-Patterns to Avoid

- **Relying on `no-restricted-imports` alone to block `fetch`:** it only inspects `import`/`require` statements. A bare `fetch(...)` call needs `no-restricted-globals`. Missing this makes success criterion #2 pass CI even when the literal rule it names ("bloquea... una llamada a fetch") is violated.
- **Using `pnpm licenses list` as the actual CI gate:** it has no allow/deny-list flag and never exits non-zero on a bad license — it is a reporting tool, not an enforcement tool. Wire `license-checker-rseidelsohn` (or an equivalent tool with real exit-code semantics) as the actual gate; keep `pnpm licenses list --json` only as a human-readable artifact if desired.
- **A bare `--onlyAllow` list for the license gate:** collapses the user's explicit 3-tier policy (allowed / manual-review / blocked) into 2 tiers, since anything not on the allow list fails identically whether it's GPL or MPL. Use `--failOn` with an explicit enumerated blocklist instead (see Open Questions for the list).
- **Creating `packages/adapters/graphology/` or `packages/adapters/neo4j/` "for consistency" with the roadmap text:** explicitly against D-09 (YAGNI, deferred to Milestone 6).
- **Declaring `react`/`three` as plain `dependencies` instead of `peerDependencies`** in `graph-renderer-three`/`react-knowledge-graph`: works fine in isolation during local development, breaks (duplicate instances / "Invalid hook call") the moment the package is consumed from `examples/*` as a real workspace dependency — pnpm's strict, non-hoisted `node_modules` makes this failure mode especially easy to trigger compared to npm/yarn.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| License compliance scanning | A custom `package.json` "license" field grep script | `license-checker-rseidelsohn` | Already handles SPDX validation, LICENSE-file fallback detection, and monorepo-aware package traversal; a hand-rolled grep script misses transitive dependencies and non-SPDX-normalized license strings |
| `THIRD_PARTY_NOTICES.md` generation | Manually transcribing license text for each dependency | `generate-license-file` (or `license-checker-rseidelsohn --files`) run against the real installed tree, output committed | Deterministic, regenerable, and won't silently miss a transitive dependency the way manual curation can |
| Cross-package TypeScript resolution / path aliases | Custom Node module-resolution hacks or hand-maintained `paths` aliases | Native TypeScript project references + pnpm workspace linking (`workspace:*` protocol) | This is exactly what `tsc --build`, editors, and (later) `tsup` already understand; hand-rolled resolution breaks IDE "go to definition" and incremental builds |
| Architecture-boundary enforcement | A custom AST-walking import checker | ESLint's built-in `no-restricted-imports` / `no-restricted-globals` (zero extra dependency, already in the stack) | These are first-class ESLint core rules purpose-built for exactly this; reach for `dependency-cruiser` only if circular-dependency/orphan-module analysis becomes a real need later |
| Monorepo task orchestration/caching | Shell scripts looping `for pkg in packages/*; do ...; done` | Turborepo (`turbo run <task>`) | Dependency-graph-aware caching and the confirmed skip-on-missing-script behavior are exactly what a hand-rolled loop would have to reimplement (badly) |
| Shared dependency version pinning across packages | A custom "sync versions" script run in CI | pnpm workspace `catalog:` protocol | Native, zero-dependency, and the version lives in exactly one file (`pnpm-workspace.yaml`) |

**Key insight:** every "Don't Hand-Roll" item above already has a maintained, purpose-built tool that is either free (ESLint core rules, TypeScript project references, pnpm catalogs) or a small, single-purpose devDependency (`license-checker-rseidelsohn`, `generate-license-file`) — there is no case in this phase where writing custom tooling reduces total code or risk.

## Common Pitfalls

### Pitfall 1: `no-restricted-imports` silently does not catch `fetch()`

**What goes wrong:** A PR adds `fetch('/api/graph')` directly inside `graph-core` or `react-knowledge-graph`. Lint passes. Success criterion #2 is violated but CI is green.
**Why it happens:** `fetch` is a global identifier in Node 18+ and all browsers — it is never `import`ed. `no-restricted-imports` (an import/require-statement rule) has nothing to inspect.
**How to avoid:** Add `no-restricted-globals` alongside `no-restricted-imports` in every package config that must block `fetch` (D-05, D-06, D-07 — all three, since ADR 0003 "aplica a toda la pila de renderizado"). Optionally add `checkGlobalObject: true` to also catch `window.fetch(...)`/`globalThis.fetch(...)` — this combination (named-global object entries + `checkGlobalObject`) was not shown together in the fetched official docs; verify it works as expected in this ESLint version before relying on it, or keep the simpler plain-string form (`no-restricted-globals: ["error", "fetch"]`), which is unambiguously documented.
**Warning signs:** A deliberate test PR adding `fetch(...)` to `graph-core` passes lint. Verify this explicitly before considering INFRA-03 done (see Slice 1's verification step above).

### Pitfall 2: `pnpm licenses list` cannot fail a CI build

**What goes wrong:** The team implements `docs/08-licensing-compliance.md`'s literal suggestion (`pnpm licenses list` "wired into CI") expecting it to block a bad-license PR. It never does — it always exits 0 and just prints a report.
**Why it happens:** Confirmed directly against the pnpm CLI reference (`pnpm.io/cli/licenses`): the only options are `--json`, `--long`, `--dev`. There is no allow-list, deny-list, or fail-on-violation flag.
**How to avoid:** Use `license-checker-rseidelsohn` (or an equivalent tool with real exit-code semantics) as the actual CI gate. Keep `pnpm licenses list --json` only as a supplementary, non-blocking, human-readable report if desired — it satisfies docs/08's letter without being load-bearing for the actual gate.
**Warning signs:** CI's "license check" step is green even when a scratch test dependency with a GPL license is added — that's the tell that the check isn't actually gating anything.

### Pitfall 3: Ambiguous license-string matching could silently merge the "manual review" and "blocked" tiers

**What goes wrong:** `license-checker-rseidelsohn`'s own README documents `--failOn`/`--onlyAllow` behavior but does **not** document whether the list entries are matched as exact SPDX strings or substrings. If matching is substring-based, a `--failOn "GPL"` entry could also match `LGPL-3.0` (since `"GPL"` is a substring of `"LGPL"`), incorrectly blocking a "manual review" tier package instead of just warning.
**Why it happens:** The tool's documentation is silent on this specific edge case (confirmed by direct inspection of the README) — an easy detail to get wrong when writing the CI script.
**How to avoid:** Enumerate exact SPDX identifiers rather than bare prefixes: `--failOn "GPL-1.0-only;GPL-1.0-or-later;GPL-2.0-only;GPL-2.0-or-later;GPL-3.0-only;GPL-3.0-or-later;AGPL-1.0-only;AGPL-3.0-only;AGPL-3.0-or-later;SSPL-1.0"` (deliberately omitting any bare `"GPL"`/`"LGPL"` prefix). Before trusting the gate, add a throwaway devDependency with a known `LGPL-3.0` license in a scratch branch and confirm it does **not** fail the build (manual-review tier), then add one with `GPL-3.0-only` and confirm it **does** fail.
**Warning signs:** Not empirically tested before merge; the gate "looks right" in a code review but has never actually seen a real GPL or LGPL package flow through it.

### Pitfall 4: `typescript-eslint`'s glob-array monorepo config misses nested adapter packages

**What goes wrong:** If typed linting is configured with the older `parserOptions.project: ['./packages/*/tsconfig.json']` pattern, it will **not** match `./packages/adapters/codebase-memory/tsconfig.json` — that path is one directory level deeper than the glob covers. Linting silently skips type-aware rules for every adapter package.
**Why it happens:** `packages/*/tsconfig.json` only expands one level; `packages/adapters/*` is nested one level further. This is a real structural property of *this* repo (`docs/03-architecture.md`'s own `packages/adapters/{...}/` layout), not a generic monorepo footgun.
**How to avoid:** Use `parserOptions.projectService: true` (typescript-eslint v8+, no manual glob array needed — it discovers the correct tsconfig per file automatically) `[CITED: Context7 /typescript-eslint/typescript-eslint]`. If the older `project: [...]` array is used for any reason, it needs a separate entry for `./packages/adapters/*/tsconfig.json`.
**Warning signs:** Typed lint rules never fire inside `packages/adapters/codebase-memory/` even though they fire correctly in `packages/graph-core/`.

### Pitfall 5: Turbo cache silently stale/ineffective without `tsbuildinfo` in `outputs`

**What goes wrong:** With `composite: true` project references, `tsc --build` writes an incremental `.tsbuildinfo` file. If `turbo.json`'s `build` task `outputs` array doesn't include that file's path, Turbo's cache restore won't bring it back — every cache hit still forces a full `tsc` rebuild, defeating the point of caching (or, less commonly, a stale `tsbuildinfo` causes an incorrect skip).
**How to avoid:** Explicitly set `"tsBuildInfoFile"` to a known path inside each package's `outDir` (e.g. `./dist/.tsbuildinfo`), and ensure `outputs: ["dist/**"]` in `turbo.json` covers it.
**Warning signs:** `turbo run build` reports a cache hit but the next `tsc` invocation still does a full recompile.

### Pitfall 6: Duplicate React/Three instances from missing/misdeclared `peerDependencies` (cross-referenced)

Already documented in the project's own `.planning/research/PITFALLS.md` (Pitfall 9) — restated here because INFRA-07 makes it this phase's direct responsibility: pnpm's strict, non-hoisted `node_modules` means a package that declares `react`/`three` as plain `dependencies` (not `peerDependencies`) can resolve its own separate copy, causing "Invalid hook call" (React) or silent broken `instanceof`/context issues (Three.js/R3F) once consumed from `examples/*`. Verified fix: `pnpm add --save-peer` writes correctly to both `peerDependencies` and `devDependencies` in one step (see Code Examples) — use it instead of manually editing `package.json`, which is easy to get only half-right.

### Pitfall 7: Recreating v2-only adapter stubs "for completeness"

`ROADMAP.md`'s literal text lists all three adapters (`codebase-memory`, `graphology`, `neo4j`) under INFRA-01. D-09 explicitly overrides this for Phase 1 (YAGNI — only `codebase-memory`). A planner or implementer working from the roadmap text alone, without reading CONTEXT.md's decisions, will over-scaffold. Flagged prominently in User Constraints above; repeated here because it is a genuine, easy-to-make mistake given two documents disagree.

## Code Examples

### `turbo.json` — task graph with `tasks` (v2.x syntax, not `pipeline`)

```json
// Source: https://github.com/vercel/turborepo/blob/main/examples/basic/turbo.json (Context7 /vercel/turborepo)
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

### Root `eslint.config.js` — D-05 through D-08 as scoped flat-config blocks

```javascript
// Sources: https://github.com/eslint/eslint/blob/main/docs/src/rules/no-restricted-imports.md,
//          https://github.com/eslint/eslint/blob/main/docs/src/rules/no-restricted-globals.md
//          (Context7 /eslint/eslint)
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const noBackendCalls = {
  paths: [
    { name: 'axios', message: 'No internal HTTP calls (ADR 0003). Pass data via props/adapters.' },
    { name: '@tanstack/react-query', importNames: ['useQuery', 'useMutation'], message: 'No data fetching inside the viewer (ADR 0003).' },
  ],
};
const noFetchGlobal = { name: 'fetch', message: 'No internal fetching (ADR 0003).' };

export default defineConfig(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: ['**/dist/**', '**/node_modules/**'] },

  // D-05: graph-core — zero React/Three/backend coupling
  {
    files: ['packages/graph-core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'react' }, { name: 'react-dom' }, { name: 'three' }, ...noBackendCalls.paths],
        patterns: [{ group: ['@react-three/*'], message: 'graph-core must not depend on Three.js/R3F.' }],
      }],
      'no-restricted-globals': ['error', noFetchGlobal],
    },
  },

  // D-06: react-knowledge-graph — react/react-dom allowed, three/backend blocked
  {
    files: ['packages/react-knowledge-graph/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'three' }, ...noBackendCalls.paths],
        patterns: [{ group: ['@react-three/*'], message: 'Access Three.js only through graph-renderer-three.' }],
      }],
      'no-restricted-globals': ['error', noFetchGlobal],
    },
  },

  // D-07: graph-renderer-three — react/three allowed, backend blocked
  {
    files: ['packages/graph-renderer-three/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: noBackendCalls.paths }],
      'no-restricted-globals': ['error', noFetchGlobal],
    },
  },

  // D-08: adapters/* — pure conversion functions, no React/Three
  {
    files: ['packages/adapters/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'react' }, { name: 'react-dom' }, { name: 'three' }],
        patterns: [{ group: ['@react-three/*'] }],
      }],
    },
  },
);
```

### GitHub Actions CI — install, build/lint/typecheck via Turbo, license gate

```yaml
# Sources: https://turborepo.dev/docs/guides/ci-vendors/github-actions (official Turborepo docs, fetched via WebFetch),
#          https://github.com/RSeidelsohn/license-checker-rseidelsohn (official README, fetched via WebFetch)
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec turbo run build lint typecheck
      - name: License compliance gate
        run: >
          pnpm dlx license-checker-rseidelsohn
          --production=false
          --excludePrivatePackages
          --failOn "GPL-1.0-only;GPL-1.0-or-later;GPL-2.0-only;GPL-2.0-or-later;GPL-3.0-only;GPL-3.0-or-later;AGPL-1.0-only;AGPL-3.0-only;AGPL-3.0-or-later;SSPL-1.0"
```

*(Exact `pnpm/action-setup`/`actions/setup-node` major-version tags — `[CITED: web synthesis]`, not independently pinned-version-verified against the GitHub Marketplace this session; confirm current tags at implementation time — see Assumptions Log A1.)*

### `pnpm-workspace.yaml` — security-by-default lifecycle-script hardening

```yaml
# Source: https://pnpm.io/supply-chain-security, https://pnpm.io/blog/2025/12/29/pnpm-in-2025 (Context7 /websites/pnpm_io)
packages:
  - 'packages/*'
  - 'packages/adapters/*'
  - 'examples/*'

# pnpm v10+ already blocks all postinstall/preinstall scripts by default ("Security by Default").
# strictDepBuilds makes an unexpected lifecycle script fail installation loudly instead of silently
# skipping — safer for a compliance-focused phase than the quiet default.
strictDepBuilds: true
onlyBuiltDependencies: []
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Turborepo `"pipeline"` key in `turbo.json` | `"tasks"` key | Turborepo v2 | Any copy-pasted v1-era `turbo.json` example must be rewritten — `"pipeline"` is silently ignored/invalid in v2.x |
| `.eslintrc.json` / `.eslintrc.js` cascading config | Flat config (`eslint.config.js`), single file, explicit `files` globs per block | ESLint v9 (default flat config) | This project should not introduce a legacy `.eslintrc*` file — flat config is required for scoping D-05..D-08 cleanly anyway |
| `typescript-eslint` manual `parserOptions.project: [glob, glob, ...]` array for monorepos | `parserOptions.projectService: true` (auto-discovers per-file tsconfig) | typescript-eslint v8 | Removes the exact nested-glob hazard described in Pitfall 4 |
| `license-checker` (davglass, original, unmaintained) | `license-checker-rseidelsohn` (community fork, actively maintained) | fork exists specifically because upstream was abandoned | Use the fork; the original should not be newly adopted |
| pnpm running all lifecycle scripts (postinstall/preinstall) by default | pnpm v10+ "Security by Default" — lifecycle scripts blocked unless explicitly allow-listed (`allowBuilds`/`onlyBuiltDependencies`) | pnpm v10.0 (further refined in v10.26 with `allowBuilds`) | Already active at the pinned pnpm 11.10.0 — no extra opt-in needed to get this protection, but a genuinely-needed native build step (none in this phase's stack) would need explicit allow-listing |

**Deprecated/outdated:** `pnpm licenses list` should not be assumed to gate CI — it never has had a fail-on-violation mode; this is not a recent deprecation, it is a persistent capability gap in the tool itself.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pnpm/action-setup@v3` and `actions/setup-node@v4` are the current recommended major-version tags for the GitHub Actions workflow | Code Examples (CI workflow) | Low — these are widely-used, low-churn actions; worst case is a one-line version bump needed at implementation time. Not independently verified against the GitHub Marketplace this session (WebSearch synthesis only). |
| A2 | `license-checker-rseidelsohn`'s `--failOn`/`--onlyAllow` use exact SPDX-string matching, not substring matching | Common Pitfalls (Pitfall 3), Code Examples | Medium — if matching is substring-based and the enumerated list isn't exhaustive/precise enough, the "manual review" tier (MPL/LGPL/EPL) could be silently blocked (over-strict) or a blocked-tier variant could slip through (under-strict). Mitigated by recommending an exhaustive explicit enumeration rather than short prefixes, and an empirical pre-merge test — but the underlying tool behavior itself is unconfirmed by its own docs. |
| A3 | The CI license gate should scan both `dependencies` and `devDependencies`, not just production dependencies | Code Examples (`--production=false` flag) | Low-Medium — docs/08 doesn't specify prod-vs-dev scope. Scanning both is the safer default for an internal, not-yet-published monorepo; narrowing to production-only later is a one-flag change if the team decides dev-tooling licenses don't need the same scrutiny. |
| A4 | Phase 1 should define the shape of a `test` task in `turbo.json` now (even though no package has real tests yet), for forward compatibility with Phase 2 | Recommended Task Sequencing, Open Questions | Low — Turborepo's confirmed skip-on-missing-script behavior makes this safe either way; if wrong, it's a one-line addition in Phase 2 instead. |
| A5 | The recommended `engines.node: ">=22.13"` floor (driven by pnpm 11.10.0's own requirement) will remain accurate | Common Pitfalls, Standard Stack | Low — re-verify via `npm view pnpm engines` whenever pnpm (or any other pinned tool) is upgraded; a future patch could raise the floor further. |

**If this table is empty:** N/A — see entries above; all are LOW-MEDIUM risk with a stated mitigation already built into the recommendations.

## Open Questions

1. **Should the CI license gate block or only warn on the "manual review" tier (MPL-2.0, LGPL variants, EPL variants)?**
   - What we know: `docs/08-licensing-compliance.md` and this project's own CLAUDE.md define three tiers (allowed / manual-review / blocked). CONTEXT.md explicitly defers the CI-blocking-scope decision, instructing the planner/researcher to default to "block only GPL/AGPL/SSPL strictly; MPL/LGPL/EPL require manual review, no automatic CI block" — and to **escalate to the user if this is ambiguous during implementation, not assume.**
   - What's unclear: The exact mechanism to give "manual review" visibility without blocking (e.g., a non-blocking CI annotation/comment vs. just leaving it out of any report at all) is not specified anywhere.
   - Recommendation: Implement the `--failOn` deny-list gate (blocks GPL/AGPL/SSPL only, per the explicit enumeration in Code Examples) as the hard gate. Optionally add a second, non-blocking CI step that surfaces any MPL/LGPL/EPL packages found (e.g., job summary output) so they're visible for manual review without failing the build. **This is a proposal, not a resolved decision — flag it back to the user per CONTEXT.md's own instruction if the planner or implementer is unsure this matches intent.**

2. **Should Phase 1 pin `engines.node` and/or add `.nvmrc`?**
   - What we know: Not explicitly required by INFRA-01 through INFRA-07's text. `pnpm` 11.10.0 itself requires Node `>=22.13`; the local dev machine already satisfies this (Node v24.15.0).
   - What's unclear: Whether this counts as in-scope "monorepo scaffolding" (INFRA-01/02) or slightly beyond the letter of the requirement.
   - Recommendation: Include it — it's a near-zero-cost addition that directly prevents a class of "works on my machine" failures for success criterion #1 ("un desarrollador puede ejecutar pnpm install... sin errores"), which explicitly depends on the environment being compatible.

3. **Should `examples/*` get a real (even if trivial) `dev`/`build` script in Phase 1, or is a bare `package.json` enough?**
   - What we know: D-11 says "skeleton de proyecto Vite... sin app funcional," to be completed in Phase 3.
   - What's unclear: Whether "skeleton" implies a working (if empty) Vite dev server, or just enough `package.json`/config to exist as a workspace member.
   - Recommendation: A minimal but real Vite config (able to run `vite build` on an empty/placeholder entry) is safer than a config-less stub — it means Phase 3 is adding a real app to a working build, not debugging Vite setup and component integration simultaneously.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling (pnpm, turbo, typescript, eslint) | ✓ | v24.15.0 | — (exceeds the `>=22.13` floor derived from pnpm's own `engines` field) |
| Corepack | pnpm version pinning/activation | ✓ | 0.34.6 | — |
| pnpm | INFRA-01, package management | ✓ (resolved on-demand via Corepack, not globally pre-installed) | 11.10.0 | Corepack auto-downloads the pinned version from the `packageManager` field — confirmed working locally |
| npm | Fallback registry queries, `npx`/`pnpm dlx` equivalents | ✓ | 11.12.1 | — |
| turbo (global) | N/A — intentionally not global | ✗ (not on PATH) | — | Expected/correct: Turborepo should be a workspace `devDependency`, invoked via `pnpm exec turbo` or a `package.json` script, not a global install |
| git | Version control, commit-based NOTICE.md SHA pin | ✓ | 2.50.1 | — |
| gh (GitHub CLI) | Already used in CONTEXT.md discussion to verify the `codebase-memory-mcp` source SHA/license (D-01/D-02) | ✓ | 2.95.0 | — |
| GitHub Actions (CI) | INFRA-03/INFRA-04 CI gates | Not yet configured (`.github/workflows/` does not exist in the repo) | — | Must be created this phase — confirmed absent via repo root listing |

**Missing dependencies with no fallback:** none — every dependency this phase needs is either already present locally or is something this phase itself creates (the CI workflow).
**Missing dependencies with fallback:** none beyond the CI workflow file itself, which this phase is responsible for authoring.

## Security Domain

This phase introduces **zero application code** — there is no authentication, session management, user input, or business logic to evaluate against the standard ASVS categories. The real security surface here is **supply-chain and build-pipeline integrity**, which the phase's own requirements (INFRA-04, INFRA-07) already partially address. `security_enforcement` is on (`security_asvs_level: 1`, `security_block_on: high` per `.planning/config.json`), so this section maps the applicable subset explicitly rather than skipping it.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | N/A — no application/user surface exists in this phase |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No | N/A — `graph-core`'s Zod validation layer is Phase 2 (CORE-02), not this phase |
| V6 Cryptography | No | N/A |
| V1 Architecture / Secure SDLC (closest fit for this phase's real risk) | Yes | Dependency-direction lint guard (D-05..D-08) + license compliance CI (INFRA-04) are exactly this category's intent: structurally-enforced architecture and supply-chain boundaries, not manual review |
| V14 Configuration (CI/CD pipeline hardening) | Yes | Pin third-party GitHub Actions by version tag at minimum (SHA-pinning preferred for non-GitHub-owned actions); `pnpm install --frozen-lockfile` in CI to prevent lockfile drift; no secrets/publish tokens should be required for this phase's CI (D-12 confirms no real publish happens yet) |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Malicious/compromised postinstall script executes arbitrary code during `pnpm install` | Tampering / Elevation of Privilege | Already mitigated by default: pnpm v10+ "Security by Default" blocks all lifecycle scripts (`preinstall`/`postinstall`) unless explicitly allow-listed via `allowBuilds`/`onlyBuiltDependencies` `[CITED: pnpm.io/supply-chain-security]`. Recommend also setting `strictDepBuilds: true` so any *new* dependency needing a lifecycle script forces an explicit, reviewed decision rather than silently skipping. Confirmed: none of this phase's recommended packages (`pnpm`, `turbo`, `typescript`, `eslint`, `typescript-eslint`, `license-checker-rseidelsohn`, `generate-license-file`, `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`) declare a `postinstall` script. |
| Copyleft/incompatible license silently entering the dependency tree (transitively) | Tampering (of the legal/compliance posture, not code) | The CI license gate itself (INFRA-04) — see Standard Stack and Common Pitfalls for why the *naive* implementation (`pnpm licenses list` alone) fails to actually mitigate this |
| Third-party GitHub Action tampered with after the workflow references it by a movable tag (e.g. `@v4` silently repointed) | Tampering | Pin to a full commit SHA for any non-GitHub-owned action; GitHub-owned actions (`actions/checkout`, `actions/setup-node`) are lower-risk but SHA-pinning remains best practice. Not strictly required to satisfy INFRA-03/04, but a reasonable low-cost hardening step this phase's CI authoring should consider. |
| Lockfile drift between a contributor's local install and CI (different resolved transitive versions) | Tampering / Repudiation | `pnpm install --frozen-lockfile` in CI (fails instead of silently re-resolving if `pnpm-lock.yaml` is out of sync with `package.json`) |
| Duplicate React/Three.js instances from misconfigured peer dependencies (not a classic "security" threat, but a supply-chain-adjacent correctness risk this phase is directly responsible for preventing) | — | `pnpm add --save-peer` + workspace `catalog:` protocol (INFRA-07) |

## Sources

### Primary (HIGH confidence)
- `npm view <pkg> version|engines|license|repository.url|scripts.postinstall` — direct npm registry queries (2026-07-08) for: `pnpm`, `turbo`, `typescript`, `eslint`, `typescript-eslint`, `license-checker-rseidelsohn`, `generate-license-file`, `dependency-cruiser`, `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`
- `gsd-tools query package-legitimacy check` — legitimacy verdicts for all packages above
- Local environment probes (`node --version`, `corepack --version`, `pnpm --version` via Corepack, `git --version`, `gh --version`)
- [Turborepo source — turbo skips packages with no matching script](https://github.com/vercel/turborepo/blob/main/crates/turborepo-task-executor/src/command.rs) via Context7 `/vercel/turborepo` — official repo source code, not just docs prose

### Secondary (MEDIUM confidence — official docs, Context7 or direct WebFetch)
- Context7 `/websites/pnpm_io` — workspace catalogs (`pnpm-workspace.yaml`, `catalogs`), `pnpm licenses list` options, `pnpm add --save-peer`, pnpm v10+ "Security by Default" lifecycle-script blocking
- Context7 `/vercel/turborepo` — `turbo.json` `tasks` schema (v2.x)
- Context7 `/microsoft/typescript-website` — composite project references, solution-style root `tsconfig.json`, `${configDir}` (TS 5.5+)
- Context7 `/eslint/eslint` — flat config `files` scoping, `no-restricted-imports` `patterns`/`group`, `no-restricted-globals`
- Context7 `/typescript-eslint/typescript-eslint` — monorepo typed-linting config, `parserOptions.projectService`
- [Turborepo — GitHub Actions guide](https://turborepo.dev/docs/guides/ci-vendors/github-actions) — official docs, fetched via WebFetch
- [license-checker-rseidelsohn README](https://github.com/RSeidelsohn/license-checker-rseidelsohn) — official repo, fetched via WebFetch

### Tertiary (LOW confidence — WebSearch synthesis, not independently cross-verified this session)
- GitHub Actions specific action version tags (`pnpm/action-setup@v3`, `actions/setup-node@v4`) — WebSearch synthesis across several 2026 monorepo CI guides
- NOTICE.md/THIRD_PARTY_NOTICES.md naming conventions — general WebSearch synthesis (no single canonical spec exists; this is community convention, not a standard)
- `dependency-cruiser` vs. ESLint `no-restricted-imports` comparison — WebSearch synthesis (not needed for this phase's actual decision, since ESLint was already the locked-in approach per D-05..D-08; included for the "Alternatives Considered" table only)
- `generate-license-file` / `@rnx-kit/third-party-notices` tool discovery — WebSearch, cross-checked once via `npm view` for version/legitimacy but not deeply exercised

## Metadata

**Confidence breakdown:**
- Standard stack (versions, engines, licenses): HIGH — every version/engines/license claim was independently confirmed via live `npm view` queries this session, cross-validated against the project's own same-day prior research
- Architecture patterns (pnpm catalogs, TS project references, ESLint flat-config scoping, Turborepo tasks): HIGH — all sourced from official docs/source code via Context7, not training-data recall
- License CI-gating exact mechanism: MEDIUM — the tools and flags are verified, but the exact SPDX-matching semantics of `--failOn`/`--onlyAllow` are undocumented by the tool itself (see Assumptions A2, Pitfall 3) — recommend empirical verification before treating the gate as trustworthy for the manual-review/blocked boundary
- GitHub Actions exact action versions: LOW-MEDIUM — functionally correct pattern (confirmed via official Turborepo docs), but specific tag numbers are WebSearch-sourced and should be re-checked at implementation time

**Research date:** 2026-07-08
**Valid until:** ~30 days for the architecture/tooling patterns (pnpm/TypeScript/ESLint mechanics change slowly); ~7 days for the exact pinned package versions given several are `[SUS]`/`too-new` and this ecosystem ships frequently — re-run `npm view` immediately before implementation if more than a few days have passed.
