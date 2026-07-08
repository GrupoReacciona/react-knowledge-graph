# Project Research Summary

**Project:** react-knowledge-graph (`@gruporeacciona/react-knowledge-graph`)
**Domain:** React 3D knowledge-graph visualization component library (Three.js / React Three Fiber), extracted from `codebase-memory-mcp` under MIT provenance, published as a backend-neutral npm package
**Researched:** 2026-07-08
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a reusable React component library for rendering knowledge graphs in 3D, extracted from an existing OSS visor (`codebase-memory-mcp`) and generalized to be backend-neutral. Experts in this space (xyflow, sigma.js/graphology, the vasturiano force-graph family) converge on the exact same architecture the project's own docs already specify: a framework-agnostic data core, a separate rendering layer, a thin public component, and adapters kept strictly outside the core dependency graph. The recommended stack — React 19, Three.js, `@react-three/fiber` 9 + `@react-three/drei` 10, Zod for validation, Zustand for internal UI state, `d3-force-3d` for default layout, pnpm workspaces + Turborepo + Changesets for the monorepo, and `tsup`/Vitest/Storybook for build and QA — is well-supported by official docs (Context7) and current npm registry data, with only the "layout engine" and "2026 packaging trend" claims resting on lower-confidence web synthesis.

The recommended approach is: build `graph-core` (neutral `GraphNode`/`GraphEdge`/`NormalizedGraph` types + validation, zero UI dependencies) first, then `graph-renderer-three` (R3F scene/camera/interaction), then the public `react-knowledge-graph` component that wraps it, and only then the backend adapters (Codebase Memory MCP, Graphology, Neo4j) — this build order is dictated by the dependency graph itself, not just convention, and matches the project's own `docs/07-roadmap.md` milestone sequencing. MVP scope (table stakes) is click/hover/selection events, pan/zoom/orbit camera, visual encoding by data, hover/selected-only labels, and a default force-directed layout; the genuine differentiator versus Cytoscape.js/Sigma.js/Reagraph is the multi-backend adapter layer plus 3D-first React-native rendering, not any single UX feature.

The primary risks are not technical-feature risks but discipline risks: (1) licensing/attribution compliance — `NOTICE.md` currently contains placeholder text and must be finalized with the exact upstream commit SHA before any code import lands; (2) shallow decoupling — a component that only removes the visible `fetchGraphFromApi()` call while still assuming code-graph-shaped data internally; (3) architectural drift — an `apiUrl`-style prop creeping back in without a CI guardrail; (4) performance cliffs that are invisible at small (mock-data) scale but hit hard at the project's own 1k-10k node target (per-node mesh draw-call blowup, `useFrame` allocation churn, O(n²) main-thread force layout); and (5) an unconstrained `metadata: Record<string, unknown>` field becoming an unaudited XSS surface once real (possibly untrusted) graph data flows through inspector/tooltip render paths. All five are addressable with early, structural gates (lint rules, CI checks, explicit test fixtures) rather than late-stage rework — see Critical Pitfalls below.

## Key Findings

### Recommended Stack

Core rendering stack is React 19 + `three` (pin ≥0.159, not whatever version the source repo shipped) + `@react-three/fiber` 9.6.1 + `@react-three/drei` 10.7.7 — these three must move together as a compatibility set (fiber/drei/react/three peer ranges are tightly coupled, verified via `npm view` peerDependencies). Zustand is recommended as an internal-only UI state store (hover/selection/camera), never exposed as a peer dependency. Zod validates the neutral `GraphNode`/`GraphEdge` schema in `graph-core`. `d3-force-3d` is the default layout engine (LOW confidence — community convention, not official docs; keep layout behind a narrow swappable interface so `ngraph.forcelayout` can be benchmarked later). Tooling: pnpm workspaces + Turborepo for the monorepo, `tsup` for dual ESM+CJS package builds, Vitest + `@testing-library/react` + `happy-dom` for non-WebGL tests, Storybook (`@storybook/react-vite`) + Playwright for actual 3D-rendering verification (jsdom/happy-dom cannot execute WebGL — this is a hard testing-strategy constraint, not a preference), and `@changesets/cli` with `linked` (not `fixed`) versioning for independent package releases.

**Core technologies:**
- `@react-three/fiber` + `@react-three/drei`: declarative R3F scene graph and camera/label/instancing helpers — gives hover/click raycasting "for free," matching the project's `onNodeClick`/`onNodeHover` API needs
- `zod`: single source of truth for both runtime validation and TS types of the neutral graph model
- `zustand`: internal, non-leaking UI state (hover/selection/camera) that avoids Context re-render storms on pointer-move-frequency events
- `d3-force-3d`: default force-directed layout, kept as a pure function isolated in `graph-core`, swappable later
- `pnpm` + `turbo` + `tsup` + `@changesets/cli`: monorepo scaffolding, build, and independent multi-package versioning

### Expected Features

Feature research (WebSearch-only, LOW-MEDIUM confidence but corroborated by the project's own design docs) is well aligned with the existing `docs/05-07`. Missing table-stakes items worth calling out explicitly: **node dragging** (not yet in the documented API — flag as an MVP gap) and **empty/loading/error states** for the viewer (not graph-specific but currently unaddressed in the component contract).

**Must have (table stakes):**
- Node/edge click, hover, double-click events (already scoped: `onNodeClick`, `onNodeHover`, `onNodeDoubleClick`, `onEdgeClick`)
- Pan/zoom/orbit camera control
- Node/edge selection (single, then multi)
- Visual encoding by data (`nodeColor`/`nodeSize`/`edgeColor`/`edgeWidth` as value or accessor)
- Label visibility strategy defaulting to `'hover' | 'selected'`, never always-on
- Default force-directed 3D layout
- Node dragging (currently a gap — should be added to MVP scope)

**Should have (competitive differentiators):**
- Backend-neutral adapter layer (Codebase Memory MCP, Graphology, Neo4j, generic JSON) — the single biggest wedge versus Cytoscape.js/Sigma.js/vis-network, none of which ship first-class knowledge-graph adapters
- React-native typed-prop API (versus Cytoscape/vis-network's imperative-wrapper model)
- 3D rendering with optional visual polish (bloom/particles), gated behind opt-in + scale thresholds
- Neighbor highlighting, inspector panel, basic search — genuine UX differentiators once core rendering is solid
- Clustering (community/attribute-based) — **not currently on the roadmap; recommend adding at Milestone 5 or 8** as the primary mitigation for "hairball at 1k+ nodes," which LOD alone does not solve

**Defer (v2+):**
- Fuzzy/near-natural-language search (Neo4j Bloom's headline feature) — legitimate later differentiator, not MVP
- Export (PNG/SVG) and presentation mode
- 2D renderer (Sigma.js-based) and vanilla-JS build — explicitly deferred per PROJECT.md, build only on validated demand
- Graph editing in-viewer and a from-scratch layout engine — **anti-features, do not build**: both violate the neutral/backend-agnostic model or duplicate mature existing solutions

### Architecture Approach

The project's own `docs/03-architecture.md` already specifies the correct, industry-validated shape: a strict layered/onion dependency direction — `graph-core` (neutral types + validation, zero UI/rendering deps) → `graph-renderer-three` (R3F scene/camera/interaction) → `react-knowledge-graph` (public component + hooks + panels) — with `adapters/*` kept as siblings, never dependencies, of the public package. This exact split (framework-agnostic core / renderer / framework binding / adapters) is independently confirmed by three unrelated ecosystems: xyflow (`@xyflow/system` + `@xyflow/react`), sigma.js/graphology (`graphology` + `sigma` + `@react-sigma/core`), and the vasturiano force-graph family (`3d-force-graph` + `react-force-graph-3d`). The data flow is strictly props-in/callbacks-out (ADR 0003: no internal fetching, ever) with interaction callbacks always resolving back to normalized `GraphNode`/`GraphEdge` objects, never raw `THREE.Mesh`/R3F internals — this is what preserves the ability to swap renderers later without a breaking API change.

**Major components:**
1. `graph-core` — neutral `GraphNode`/`GraphEdge`/`NormalizedGraph` types, Zod validation, ID normalization, filter/group/stat utilities; depends on nothing, everything else depends on it
2. `graph-renderer-three` — R3F scene, camera, controls, node/edge meshes, raycasting-based hover/click, animation; depends only on `graph-core` + rendering libs
3. `react-knowledge-graph` — public `<KnowledgeGraphViewer/>`, hooks (`useGraphSelection`, `useGraphSearch`, `useGraphFilters`, `useGraphCamera`, `useGraphStats`), optional panels (Inspector/SearchBox/Legend); the only package end consumers import directly
4. `adapters/{codebase-memory,graphology,neo4j}` — pure, one-way conversion functions to `NormalizedGraph`; each its own installable package, never imported by the core library packages

### Critical Pitfalls

1. **Placeholder attribution shipped with the import** — `NOTICE.md` still contains "replace this notice" language; must be finalized with the real upstream commit SHA, copyright holder, and license text *before* Milestone 2's import, as its own atomic commit. A retroactive fix doesn't erase the non-compliant history.
2. **Shallow decoupling ("moved the fetch call, not the coupling")** — the easy win (removing `fetchGraphFromApi()`) can pass review while the component's internals still assume code-graph-shaped data (AST-derived IDs, code-specific `kind`/`group` vocab). Verify by feeding the component a structurally different mock graph (e.g., Graphology export, GraphRAG-shaped data) before declaring Milestone 3 done.
3. **Architectural drift via a re-introduced `apiUrl`-style prop** — ADR 0003 bans internal fetching, but nothing currently enforces it. Add a CI grep/lint rule blocking `fetch`/`axios`/`useQuery` in `react-knowledge-graph`'s source from the moment the component exists, not just as a one-time manual review.
4. **Performance cliffs invisible until scale** — one `<mesh>` per node/edge (draw-call blowup past a few hundred nodes) and O(n²) synchronous force-layout ticks inside `useFrame` (main-thread blocking from ~300-400 nodes, severe by ~1000) both look fine against Milestone 2-4 mock data and become the dominant failure mode at the project's own 1k-10k node target. Design for instancing and off-main-thread layout starting at Milestone 3, verify at Milestone 5 — do not treat this as a retrofit.
5. **Unconstrained `metadata` as an unaudited XSS surface** — the neutral schema's `Record<string, unknown>` metadata field plus custom render props shifts sanitization onto every consumer by default. Bake text-escaping into default label/tooltip renderers; never use `dangerouslySetInnerHTML` without an explicit, documented opt-in.

Two additional pitfalls with concrete, cheap-to-fix-early gates: **no CI license enforcement** (GPL/AGPL can enter transitively via `pnpm add` undetected — wire `pnpm licenses list`/`license-checker-rseidelsohn` into CI before the first real dependency lands) and **duplicate React/Three instances from missing `peerDependencies`** (declare `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei` as peer deps everywhere, use a pnpm workspace `catalog` entry, verify by installing into `examples/*` as a real workspace dependency).

## Implications for Roadmap

Research strongly confirms the project's existing `docs/07-roadmap.md` milestone sequencing is architecturally sound — the dependency graph (graph-core → renderer → component → adapters) *forces* this order, it isn't just a planning preference. The suggested phase structure below maps directly onto that roadmap, with two research-driven insertions: an explicit compliance/scaffolding gate at Phase 1, and clustering added as an explicit feature (not currently scoped) at Phase 5.

### Phase 1: Repo Scaffolding & Compliance Gates
**Rationale:** Every pitfall with the highest recovery cost (attribution, licensing, peer-dependency misconfiguration) is cheapest to prevent structurally, before any feature code exists, and hardest/most expensive to retrofit once packages and imports multiply.
**Delivers:** pnpm workspace + Turborepo scaffold, `tsconfig.base.json`, ESLint/Prettier config with a `no-restricted-imports` rule blocking React/Three.js imports in `graph-core`, CI license-check (`pnpm licenses list` or `license-checker-rseidelsohn`) wired in before any real dependency is added, `NOTICE.md` finalized with the exact upstream commit SHA/copyright/license text.
**Addresses:** foundational project-hygiene table stakes (not a FEATURES.md item, but a hard precondition for everything else).
**Avoids:** Pitfall 1 (placeholder attribution), Pitfall 8 (no license CI), Pitfall 9 (duplicate React/Three instances).

### Phase 2: `graph-core` Neutral Data Model
**Rationale:** Every other package depends on this; it's the cheapest package to get right in isolation (pure TypeScript, fast unit tests, zero DOM/WebGL) and the one place where "neutral" must be genuinely proven, not just documented.
**Delivers:** `GraphNode`/`GraphEdge`/`NormalizedGraph` types, Zod-based validation (unique IDs, edge source/target existence, ID normalization), filter/group/stat utilities.
**Uses:** `zod`, `typescript` (strict, project references), `vitest`, `tsup`.
**Implements:** `graph-core` component from the Architecture Approach.

### Phase 3: Minimal Renderer + Public Component (Mock Data)
**Rationale:** Validates the R3F rendering approach and the props-in/callbacks-out contract end-to-end before any adapter exists; this is also where the instancing/off-thread-layout *design decisions* must be made, even if execution is deferred, because retrofitting them later is a near-rewrite.
**Delivers:** `graph-renderer-three` (scene/camera/controls/raycasting) + `react-knowledge-graph`'s `<KnowledgeGraphViewer/>` rendering against mock `nodes`/`edges`, with click/hover/selection events resolving to `GraphNode`/`GraphEdge` (never raw Three.js objects), pan/zoom/orbit camera, visual encoding, hover/selected-only labels, default `force-3d` layout, and node dragging (flagged gap — add to MVP scope).
**Addresses:** all table-stakes features from FEATURES.md.
**Avoids:** Pitfall 2 (shallow decoupling — verify against a structurally different mock dataset before sign-off), Pitfall 3 (apiUrl drift — add the CI guardrail here), Pitfall 4 & 6 design decisions (draw-call/layout architecture), Pitfall 5 (`useFrame` allocation — establish the lint convention now), Pitfall 7 (XSS — default-safe label/tooltip rendering).

### Phase 4: Exploration UX
**Rationale:** Every reviewed competitor (and this project's own feature-dependency graph) sequences UX-on-small-graphs before performance-at-scale hardening; selection/hover is the hub dependency that neighbor highlighting, the inspector, and search all branch from.
**Delivers:** `useGraphSearch` + camera centering, `useGraphFilters` (by kind/group), neighbor highlighting on selection, optional `<GraphInspector>` panel.
**Uses:** hooks architecture already scoped in `react-knowledge-graph`.
**Implements:** the "Should have" differentiator tier from FEATURES.md (excluding adapters).

### Phase 5: Performance Hardening & Clustering
**Rationale:** This is where the invisible-until-scale pitfalls (draw-call blowup, main-thread-blocking layout) must be verified against real benchmarks, not assumed fixed by the Phase 3 design. Clustering is the recommended addition here since LOD/instancing alone don't solve visual legibility at 1k+ nodes.
**Delivers:** `InstancedMesh`-based node rendering, batched/instanced edge geometry, Web Worker or Barnes-Hut layout computation, benchmarks at 1k/5k/10k nodes, clustering (attribute-based or community detection, likely via `d3-force-cluster-3d`-style extension of the base layout).
**Addresses:** the P2 "Performance/LOD" and "Clustering" rows from the Feature Prioritization Matrix.
**Avoids:** Pitfall 4 (draw-call blowup) and Pitfall 6 (main-thread-blocking force layout) — verified, not just designed-for.

### Phase 6: Backend Adapters
**Rationale:** Adapters genuinely cannot start earlier — they require `graph-core` to be provably backend-free (Phase 2-3), or every adapter ends up doing the real decoupling work that should have happened earlier (Pitfall 2's failure mode).
**Delivers:** `adapters/codebase-memory`, `adapters/graphology`, `adapters/neo4j` — each a pure, one-way conversion function to `NormalizedGraph`, each independently installable, run through the same `graph-core` validators as any other input (no "trusted source" bypass).
**Addresses:** the project's core differentiator (multi-backend adapter layer) from FEATURES.md.
**Avoids:** the Neo4j-specific gotcha (driver-native Integer/Node/Relationship types don't JSON-serialize cleanly — convert explicitly before normalization) and re-coupling `graph-core` to backend-specific concepts.

### Phase 7: Publication & Versioning
**Rationale:** Only worth doing once the API surface has stabilized through real (Phase 3-6) usage; publishing an unstable API is more costly to walk back than deferring publication briefly.
**Delivers:** `@changesets/cli` workflow (`linked` config), dual ESM+CJS builds via `tsup`, README/API docs, internal-registry publication gated behind explicit internal approval (per PROJECT.md's publication-approval constraint).
**Avoids:** Pitfall — publishing without internal approval (Security Mistakes table).

### Phase 8 (deferred, demand-gated): 2D Renderer / Export / Vanilla JS
**Rationale:** Explicitly out of scope unless internal usage reveals real demand — do not build speculatively (PROJECT.md's own framing).
**Delivers:** Sigma.js-based 2D renderer, PNG/SVG export/presentation mode, vanilla-JS port (using `@react-three/drei-vanilla` as the reference pattern) — only if triggered by real usage signals.

### Phase Ordering Rationale

- The dependency direction (`graph-core` → `graph-renderer-three` → `react-knowledge-graph` → `adapters/*`) is not a convention choice — it's structurally enforced, confirmed by three independent verified precedents (xyflow, sigma/graphology, vasturiano force-graph family). Reordering any of Phases 2-3-6 would mean building against an unstable or nonexistent dependency.
- Compliance/scaffolding gates (Phase 1) are front-loaded specifically because their recovery cost is HIGH-to-MEDIUM once real code/dependencies exist (permanent non-compliant git history, retroactive dependency audits), while their prevention cost is LOW when done first.
- UX exploration (Phase 4) is deliberately sequenced before performance hardening (Phase 5) — this matches how every reviewed competitor evolved (features first on small graphs, hardening for scale second) and is validated by the feature-dependency graph in FEATURES.md, not just convenience.
- Clustering was not on the original roadmap; inserting it into Phase 5 (rather than a separate late phase) reflects that it's an extension of the base force layout, not an independent capability.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Performance Hardening):** instancing implementation details, Web Worker layout integration patterns, and Barnes-Hut approximation are non-trivial and only LOW-MEDIUM confidence in current research (community sources, not official docs) — warrants a dedicated `--research-phase` pass before implementation.
- **Phase 6 (Backend Adapters):** Neo4j driver type-conversion specifics and Graphology attribute-mapping conventions are under-researched (MEDIUM confidence at best) — verify against `neo4j-driver` and `graphology` official docs before implementation.
- **Phase 3 (Minimal Renderer):** R3F interaction/raycasting patterns are MEDIUM confidence (Context7-sourced but not deeply exercised) — a focused research pass on hover/click raycasting + label occlusion (`drei`'s `Html`) would reduce implementation risk.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffolding):** pnpm workspaces + Turborepo + Changesets is HIGH-confidence, extremely well-documented tooling.
- **Phase 2 (`graph-core`):** Zod-based validation of a plain TypeScript data model is a standard, low-risk pattern.
- **Phase 4 (Exploration UX):** hooks-based selection/search/filter state is a well-established React pattern with no unusual technical risk.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core rendering/build versions verified via Context7 official docs + live npm registry `peerDependencies` queries (HIGH); layout-engine choice and "2026 packaging best practice" framing are LOW-confidence web synthesis |
| Features | LOW-MEDIUM | WebSearch-only this pass, no Context7/verified-docs cross-check; raised in practical confidence because findings are internally consistent across multiple independent sources and corroborate the project's own pre-existing design docs |
| Architecture | HIGH (project docs) / MEDIUM (ecosystem cross-check) | Project's own `docs/03-architecture.md` is the binding spec (HIGH); independently cross-verified against three real, unrelated open-source precedents (xyflow, sigma/graphology, vasturiano force-graph family) at MEDIUM confidence |
| Pitfalls | MEDIUM (HIGH for R3F-specific guidance) | R3F performance/`useFrame` guidance sourced from official pmndrs docs via Context7 (HIGH); extraction, licensing-process, and monolith-decomposition guidance is MEDIUM/LOW — general web sources, not project-specific case studies |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Layout engine choice (`d3-force-3d` vs `ngraph.forcelayout`):** LOW confidence, community-sourced comparison only. Keep the layout computation behind a narrow, swappable interface in `graph-core` (already recommended) and benchmark both directly against real graph sizes before Phase 5 commits to one.
- **Feature research source quality:** All of FEATURES.md is WebSearch-derived with no Context7/official-docs cross-check. Numeric competitor claims (e.g., "100k-500k nodes," specific fps figures) should be treated as directional only — do not use them as hard performance commitments for Phase 5 without independent benchmarking.
- **ESM-only vs dual ESM+CJS publishing:** Current recommendation (dual-publish via `tsup`) is a considered but LOW-confidence-on-the-"2026 trend" judgment call — revisit at Phase 7 based on what Grupo Reacciona's actual internal consuming apps/toolchains require.
- **Node dragging and empty/loading/error states:** Identified as table-stakes features missing from the current documented API surface (`docs/05-react-api.md`) — should be explicitly added to Phase 3's scope rather than discovered as a gap later.
- **Clustering:** Not on the existing roadmap at all; recommended insertion at Phase 5 needs validation against real graph shapes (code graphs vs. GraphRAG-shaped graphs may cluster very differently) once adapters exist.

## Sources

### Primary (HIGH confidence)
- `/pmndrs/react-three-fiber` (Context7) — pointer events/raycasting, render-loop internals, `useFrame` pitfalls, `no-new-in-loop` ESLint rule
- `/pmndrs/drei` (Context7) — `Html`, `Text`, `Instances`/`createInstances`, camera controls
- `/mrdoob/three.js` (Context7) — `InstancedMesh` API and performance model
- `/egoist/tsup`, `/vitest-dev/vitest`, `/storybookjs/storybook`, `/changesets/changesets` (Context7) — build/test/publish tooling APIs
- [Scaling performance — React Three Fiber](https://r3f.docs.pmnd.rs/advanced/scaling-performance) — official docs
- [pnpm Workspaces documentation](https://pnpm.io/workspaces) — official docs
- [The MIT License — Open Source Initiative](https://opensource.org/license/mit) — canonical license text
- npm registry `npm view <pkg> version|peerDependencies|dependencies` direct queries (2026-07-08) for all pinned stack versions
- Project documents: `.planning/PROJECT.md`, `docs/03-architecture.md`, `docs/04-data-model.md`, `docs/05-react-api.md`, `docs/06-extraction-plan.md`, `docs/07-roadmap.md`, `docs/08-licensing-compliance.md`, `docs/adr/0001-0003`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONCERNS.md`, `NOTICE.md`

### Secondary (MEDIUM confidence)
- [xyflow/xyflow — Package Architecture (DeepWiki)](https://deepwiki.com/xyflow/xyflow/1.1-package-architecture) — core/framework-binding split precedent
- [sigma.js official site](https://www.sigmajs.org/) / [jacomyal/sigma.js](https://github.com/jacomyal/sigma.js/) — graph-model/renderer separation precedent
- [vasturiano/react-force-graph](https://github.com/vasturiano/react-force-graph) / [3d-force-graph](https://github.com/vasturiano/3d-force-graph) — framework-agnostic core + thin React wrapper precedent
- [Reagraph](https://reagraph.dev/) / [reaviz/reagraph](https://github.com/reaviz/reagraph) — closest React+WebGL competitive comparable
- [Open Source Software Licenses 101: The MIT License — FOSSA](https://fossa.com/blog/open-source-licenses-101-mit-license/)
- [Missing peerDependencies causes duplicate React instances — callstack/react-native-slider#769](https://github.com/callstack/react-native-slider/issues/769) — concrete real-world pitfall instance

### Tertiary (LOW confidence, needs validation)
- Web search synthesis on "best practices publishing React component npm package 2026" (ESM-only trend)
- Web search synthesis on d3-force-3d vs ngraph.forcelayout comparison
- [Cytoscape.js vs vis-network vs Sigma.js 2026 — PkgPulse](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026), Cambridge Intelligence blog series, Neo4j Bloom product docs — all FEATURES.md competitor claims, directional only
- [How To Create a Component Library From a Monolith — Case Study](https://medium.com/flatwave-insights/how-to-create-a-component-library-from-a-monolith-a-case-study-4a8b3f01e590) and related monolith-extraction articles — single-source extraction anti-pattern framing

---
*Research completed: 2026-07-08*
*Ready for roadmap: yes*
