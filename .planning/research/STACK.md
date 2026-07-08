# Technology Stack

**Project:** react-knowledge-graph (`@gruporeacciona/react-knowledge-graph`)
**Domain:** React 3D/graph-visualization library (Three.js / React Three Fiber), published as a reusable npm package with a neutral `nodes`/`edges` data model
**Researched:** 2026-07-08
**Overall confidence:** MEDIUM-HIGH (core rendering/build stack verified against official docs via Context7 + live npm registry versions; broader "2026 best practice" framing is LOW-confidence web synthesis and should be treated as directional, not gospel)

## Recommended Stack

### Core Framework / Rendering

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `react` / `react-dom` | 19.2.7 | Component model, peer dependency | Project constraint (docs/PROJECT.md): React-first. `@react-three/fiber` 9.x and `@react-three/drei` 10.x both hard-pin `peerDependencies.react: "^19"` (drei) / `">=19 <19.3"` (fiber) — React 19 is not optional, it's required by the renderer stack. Confidence: HIGH (verified via `npm view <pkg> peerDependencies`). |
| `three` | 0.185.1 | Underlying WebGL 3D engine | The visor being extracted from `codebase-memory-mcp` is already built on Three.js (project constraint). `@react-three/fiber` requires `three >=0.156` (fiber) / `>=0.159` (drei) — pin to current minor, not to whatever version the source repo shipped, since Three.js has no semver stability guarantee and old point releases regularly break with new fiber/drei. Confidence: HIGH. |
| `@react-three/fiber` | 9.6.1 | React renderer for Three.js (declarative scene graph, render loop, pointer-event raycasting) | This is the architectural anchor of `graph-renderer-three` (docs/03-architecture.md). Fiber gives you `onClick`/`onPointerOver`/`onPointerOut`/`onPointerMove`/`onPointerMissed` directly on `<mesh>`/`<points>` JSX via built-in raycasting — this is exactly the hover/selection interaction model `KnowledgeGraphViewer` needs (`onNodeClick`, `onNodeHover`), so you get it for free instead of hand-rolling a raycaster. Confidence: MEDIUM (Context7 docs). |
| `@react-three/drei` | 10.7.7 | Fiber helper library: `OrbitControls`, `Html` (DOM-in-3D overlays for labels/tooltips), `Text` (SDF text via troika-3d-text), `Instances`/`createInstances` (typed instanced rendering) | Avoids reimplementing camera controls, node/edge labels, and instancing boilerplate. `Html` occlusion support is the standard way to render node-label tooltips that respect 3D depth. Confidence: MEDIUM (Context7 docs). |
| `@react-three/postprocessing` | 3.0.4 | Bloom/outline/selective-glow effects | **Defer to a later milestone**, not Milestone 1-3. Listed in docs/03 as an allowed dependency for `graph-renderer-three`, but it adds render-pipeline complexity (multi-pass composer) that isn't needed for a minimal viewer. Pull it in only when a "highlight selected node" visual-polish phase is scoped. Confidence: MEDIUM. |

### Layout Engine

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `d3-force-3d` | 3.0.6 | 3D force-directed node positioning | PROJECT.md defers "motor de layouts avanzado propio" but the viewer still needs *some* default positioning for the MVP mock-data demo. `d3-force-3d` is a drop-in fork of `d3-force` that adds `numDimensions(3)`, is what the most popular 3D graph libraries in this space (`3d-force-graph`, `react-force-graph-3d`) use under the hood, and is fully declarative-data-in/positions-out — it fits the "graph enters as data" architecture decision (docs/03) without requiring an API/imperative coupling. Confidence: LOW (web search synthesis, not official docs — verify by reading the source directly before depending on it). |
| `ngraph.forcelayout` + `ngraph.graph` | 3.3.1 / 20.1.2 | Alternative/complementary layout engine | Simpler API, faster on large graphs, no DAG-layout frills. Worth benchmarking against `d3-force-3d` once the project reaches Milestone 5 (perf at 1k-10k nodes) — don't decide between them yet; keep the layout computation isolated behind a small interface in `graph-core` so it's swappable. Confidence: LOW. |

**Placement:** put the layout computation in `graph-core` (pure function: `NormalizedGraph -> positioned nodes`), not in `graph-renderer-three`. This keeps the "no React, no Three.js dependency in graph-core" rule (docs/03) intact only if the layout package itself has zero DOM/WebGL dependency — both `d3-force-3d` and `ngraph.forcelayout` qualify (they're pure math, no rendering).

### State Management (inside `react-knowledge-graph`)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `zustand` | 5.0.14 | Internal hover/selection/camera UI state | Zustand is the de facto state library in the pmndrs ecosystem (Fiber/Drei's own maintainers use it; it plays well with the render-loop-outside-React model Fiber uses). Keep it as an *internal implementation detail* of `react-knowledge-graph`, never exposed as a required peer dependency — consumers should only see props (`nodes`, `edges`, `onNodeClick`, `onNodeHover`), per the "data in, not API calls" architecture decision. Confidence: MEDIUM (ecosystem convention, not from an official doc query). |

### Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `zod` | 4.4.3 | Runtime schema validation of `GraphNode`/`GraphEdge` in `graph-core` | docs/04-data-model.md explicitly requires validating unique node IDs, edge `source`/`target` existence, non-empty IDs, and edge-id normalization. Zod gives you a single schema that generates both the runtime validator and (via `z.infer`) the TypeScript type, keeping `graph-core`'s types and validation logic from drifting apart. It has zero dependencies and is MIT-licensed (compliant with docs/08 license policy). Confidence: MEDIUM (standard library choice, not fetched from Context7 in this pass — well-established). |

### Build Tooling (per-package library bundling)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `tsup` | 8.5.1 | Bundles each package (`graph-core`, `graph-renderer-three`, `react-knowledge-graph`, each adapter) to ESM+CJS with `.d.ts` | esbuild-based, zero-config, and is the standard choice for TS component-library bundling in 2025-2026 (verified via Context7 docs: `--format esm,cjs`, `--dts` flag, `defineConfig` with `external` for peer deps). Faster and simpler than a hand-rolled Rollup config for a monorepo with 6+ small packages. Confidence: MEDIUM (Context7 docs) for the tool itself; LOW (web synthesis) for "still the standard in 2026" framing — see ESM-only note below. |
| `tsdown` | 0.22.4 | Rolldown-based successor to tsup, same CLI surface | Watch this one. It's the tool tsup's own author is migrating toward (Rolldown/Oxc-based, faster). Not mature enough yet to be the Milestone 1-3 default, but re-evaluate at Milestone 7 (publicación/versionado) before locking in tooling long-term. Confidence: LOW. |
| `typescript` | 6.0.3 | Type system across all packages | `strict: true`, `declaration: true`, `declarationMap: true`. Use TS project references (`tsconfig.base.json` + per-package `tsconfig.json`) so `graph-core` types are consumed correctly by `graph-renderer-three` and `react-knowledge-graph` without circular build issues. Confidence: HIGH (npm registry version query). |

### Monorepo & Package Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `pnpm` (workspaces) | 11.10.0 | Package manager + monorepo workspace linking | Matches the `packages/*` + `examples/*` layout already specified in docs/03-architecture.md. pnpm's strict node_modules resolution catches accidental phantom dependencies early — valuable for a library with a hard "no coupling to backend/MCP/SQLite" rule, since it makes illegal cross-package imports fail loudly. Confidence: HIGH (standard, widely adopted for this exact monorepo shape). |
| `turbo` (Turborepo) | 2.10.4 | Task orchestration/caching across packages (build, test, lint) | With 6+ packages (`graph-core`, `graph-renderer-three`, `react-knowledge-graph`, 3 adapters, examples), a naive `npm run build --workspaces` will re-build unchanged packages every time. Turborepo's dependency-graph-aware caching keeps CI and local iteration fast as adapters (Milestone 6) are added. Confidence: MEDIUM. |
| `@changesets/cli` | 2.31.0 | Versioning + changelog + publish workflow for the multi-package repo | Verified via Context7: `changeset init` → per-PR changeset files → `changeset version` (bumps + changelogs) → `changeset publish`. Use the `linked` config (not `fixed`) to let `graph-core`/`graph-renderer-three`/`react-knowledge-graph` version independently but keep changelogs correlated — `fixed` would force-bump every package on every change, which is wrong for a layered architecture where `graph-core` should change far less often than the top-level component. Directly required by Milestone 7 (publicación/versionado) in the roadmap. Confidence: MEDIUM. |

### Testing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `vitest` | 4.1.10 | Test runner across all packages | Already Vite-native, shares config/transform pipeline with the examples app and Storybook builder, avoids running two different test runners (Jest + something else) in one repo. Confidence: HIGH (npm registry) / MEDIUM (Context7 for API specifics). |
| `@testing-library/react` | 16.3.2 | Component-level tests (props → rendered output, event callbacks fire) | Standard for testing that `<KnowledgeGraphViewer onNodeClick={fn} />` actually invokes `fn`. **Caveat (important):** `@testing-library/react` + `jsdom`/`happy-dom` **cannot execute WebGL** — `<Canvas>` from `@react-three/fiber` will not actually render a scene in a DOM-simulated test environment. Use RTL only for the parts of `react-knowledge-graph` that are plain DOM (panels, controls, prop-to-callback wiring), not for verifying that nodes/edges actually appear in the 3D scene. |
| Storybook interaction tests / Playwright (visual) | see below | Verifying actual 3D rendering, camera behavior, node positions | For anything that requires a real WebGL context (does clicking a node in 3D space call `onNodeClick`? does the graph render N instanced nodes?), use Storybook stories driven by Playwright/Chromatic-style visual or interaction tests, not Vitest+jsdom. This is a pitfall worth flagging explicitly for the roadmap: **do not assume Vitest unit tests can validate R3F rendering correctness.** Confidence: MEDIUM (well-known limitation of jsdom/happy-dom, not something Context7 surfaced directly). |
| `happy-dom` | 20.10.6 | Faster jsdom alternative for Vitest's DOM environment | Faster startup than `jsdom` for the non-WebGL test suites (validation logic in `graph-core`, prop-wiring in `react-knowledge-graph`). Confidence: MEDIUM. |

### Documentation / Examples

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `storybook` + `@storybook/react-vite` | 10.4.6 | Interactive component documentation and manual QA surface for `KnowledgeGraphViewer` | Explicitly requested in PROJECT.md ("Ejemplos con Storybook o Vite"). `@storybook/react-vite` is the correct framework package for a Vite-based monorepo (verified via Context7: `defineMain` + `getAbsolutePath` pattern for pnpm workspace resolution). In a pnpm workspace, remember to add cross-package `.tsx` sources to `typescript.reactDocgenTypescriptOptions.include` or props from `graph-core`/`graph-renderer-three` won't show up in the auto-generated docs. Confidence: MEDIUM (Context7 docs). |
| `vite` | 8.1.3 | Dev server/bundler for `examples/*` demo apps | Matches Storybook's builder, gives instant HMR for manual testing of the viewer against mock data during Milestone 2-3 development. Confidence: HIGH (npm registry). |

### Linting / Formatting

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `eslint` + `typescript-eslint` | 10.6.0 / 8.63.0 | Static analysis, catch `graph-core` → React/Three.js coupling violations | Configure a custom lint rule or `no-restricted-imports` in `graph-core`'s ESLint config to hard-fail any `import ... from 'react'` or `'three'` — this makes the "graph-core must not depend on React or Three.js" architecture rule (docs/03) machine-enforced instead of just documented. |
| `prettier` | 3.9.4 | Formatting | Standard, no configuration debates needed. |

## Installation

```bash
# Workspace root
pnpm add -D typescript turbo @changesets/cli eslint typescript-eslint prettier

# graph-core (no React/Three.js dependency)
pnpm --filter @gruporeacciona/graph-core add zod d3-force-3d
pnpm --filter @gruporeacciona/graph-core add -D tsup vitest

# graph-renderer-three
pnpm --filter @gruporeacciona/graph-renderer-three add three @react-three/fiber @react-three/drei
pnpm --filter @gruporeacciona/graph-renderer-three add -D @types/three tsup vitest

# react-knowledge-graph (public package)
pnpm --filter @gruporeacciona/react-knowledge-graph add zustand
pnpm --filter @gruporeacciona/react-knowledge-graph add -D react react-dom tsup vitest @testing-library/react happy-dom

# examples/storybook
pnpm add -D -w storybook @storybook/react-vite vite @vitejs/plugin-react
```

Note on peer dependencies: `react`, `react-dom`, and `three` must be declared as `peerDependencies` (with matching `peerDependenciesMeta`/version ranges) in `react-knowledge-graph` and `graph-renderer-three`'s `package.json`, and only as `devDependencies` for local testing — never bundled. This is required both by the architecture ("desacoplado de backend") and by npm's own dependency-hygiene norms for React component libraries (avoids duplicate React/Three.js instances in consumer apps, which breaks `@react-three/fiber`'s Canvas context and React's hooks rules).

## Alternatives Considered

| Category | Recommended | Alternative | Why Not (for this project, now) |
|----------|-------------|-------------|----------------------------------|
| Graph viz library | Build bespoke on `@react-three/fiber` (extracted from `codebase-memory-mcp`) | `react-force-graph-3d` / `3d-force-graph` (vasturiano) | These are complete, opinionated, imperative-core-wrapped-in-React libraries — adopting one would mean rewriting the extraction as "wrap a third-party engine" rather than "own the renderer," contradicting the explicit goal of extracting/evolving the existing R3F visor (PROJECT.md, docs/01). Worth reading their source for patterns (instancing approach, camera fit-to-graph logic) even while not depending on them. |
| Graph viz library | (same) | `reagraph` | A from-scratch React+WebGL(three.js) graph library with a real, actively maintained architecture — the closest "we could have just used this" alternative. Rejected for the same reason: the project's stated purpose is extracting and evolving the existing codebase-memory-mcp visor, not adopting a third-party viewer. Re-evaluate only if the extraction proves substantially harder than expected. |
| Bundler | tsup | Rollup (hand-configured with `rollup-plugin-peer-deps-external`, `@rollup/plugin-typescript`, `rollup-plugin-dts`) | More config surface for equivalent output; only worth it if tsup's esbuild-based `.d.ts` generation proves insufficiently precise (e.g., complex generic re-exports across `graph-core`/`graph-renderer-three` boundaries) — if that happens, use tsup's `--experimental-dts` (api-extractor) before reaching for Rollup. |
| Module format | Dual ESM+CJS via tsup | ESM-only | Some 2026 guidance argues ESM-only is now viable since Node 23+ can `require()` ESM. Still recommend dual-publish for Milestone 1-3: Grupo Reacciona's internal consuming apps and CI toolchains aren't guaranteed to be on ESM-ready tooling yet, and the downside of dual-publish (slightly larger package, `exports` map complexity) is small compared to the support cost of an ESM-only package breaking someone's older bundler config. Revisit at Milestone 7. |
| Layout engine | `d3-force-3d` (default) | `ngraph.forcelayout` | Faster on large graphs per community reports, but less battle-tested integration with the R3F ecosystem examples available for reference. Keep the layout function behind a narrow interface in `graph-core` so switching later (or offering both, Milestone 5 perf work) is a small change, not a rewrite. |
| Validation | `zod` | Hand-written type guards / `io-ts` / `valibot` | Zod is heavier than `valibot` (bundle size) but has far more ecosystem familiarity and better TS inference ergonomics for a small, non-performance-critical validation surface (validating a `nodes`/`edges` payload, not a hot loop). If bundle size of `graph-core` becomes a real complaint, revisit `valibot` — it's a drop-in-ish API. |
| State management (internal) | `zustand` | React Context + `useReducer` | Context re-renders the entire subtree on every hover/selection change unless carefully split; zustand's selector-based subscriptions avoid this without extra memoization ceremony, which matters when hover events can fire at pointer-move frequency. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Pinning `three` to whatever version `codebase-memory-mcp` currently uses | Three.js has no semver stability contract; old three.js versions accumulate known incompatibilities with newer `@react-three/fiber`/`drei` releases, and the extraction is a chance to reset this debt, not carry it forward. | Pin to the current `three` minor compatible with `@react-three/fiber@9`/`@react-three/drei@10` (`>=0.159`), and re-verify compatibility whenever bumping fiber/drei. |
| `react-scripts` / CRA-style tooling, Webpack for the library build | Dead/deprecated for library authoring; slow, heavyweight, wrong tool for a package (not an app). | `tsup` for library builds, `vite` for the examples app. |
| Redux / Redux Toolkit for internal viewer state | Massive overkill for hover/selection/camera UI state scoped to a single component tree; adds a peer-dependency-like footprint most consumers of a viz library won't want. | `zustand`, scoped as an internal implementation detail. |
| Testing 3D rendering correctness with Vitest + jsdom/happy-dom alone | jsdom/happy-dom do not implement WebGL; a `<Canvas>` mounted in these environments does not actually render geometry, so assertions about "N nodes appear in the scene" are either impossible or meaningless (they'd pass against a canvas that never truly rendered). | Vitest+RTL for prop-wiring/DOM-adjacent logic; Storybook + Playwright (or a headless-gl-backed test if truly needed) for real rendering assertions. |
| Coupling `graph-core` to any renderer or backend type (Three.js types, MCP types, SQLite row shapes, AST node types) | Directly violates the stated architecture decision and the entire reason this extraction exists (docs/01, docs/03, docs/04). | Keep `graph-core` limited to `GraphNode`/`GraphEdge`/`NormalizedGraph` + pure validation/normalization/filtering utilities; all backend-specific shapes live in `adapters/*`. |
| GPL/AGPL/SSPL-licensed dependencies anywhere in the tree | Blocked outright by docs/08 license policy given the MIT-publication intent. | Everything recommended above (React, Three.js, R3F, Drei, zod, zustand, d3-force-3d, ngraph, tsup, vitest, Storybook, Changesets, ESLint, Prettier) is MIT/BSD/ISC-licensed. Verify any new dependency against docs/08's allowed-license list before adding it. |

## Stack Patterns by Variant

**If node/edge counts stay in the hundreds (Milestone 1-4 scope):**
- Plain `<mesh>` per node is acceptable; instancing is a nice-to-have, not a requirement yet.
- `d3-force-3d` layout computed synchronously on the main thread is fine.

**If node/edge counts reach 1k-10k (Milestone 5, "rendimiento"):**
- Switch node rendering to `THREE.InstancedMesh` via `@react-three/drei`'s `Instances`/`createInstances` — this is the single highest-leverage change for draw-call count (N draw calls → 1).
- Move layout computation off the main thread (Web Worker) since force simulations at this scale block the render loop if run synchronously; both `d3-force-3d` and `ngraph.forcelayout` are pure-JS and worker-friendly.
- Re-benchmark `d3-force-3d` vs `ngraph.forcelayout` at this scale before committing further.

**If/when a vanilla-JS build is requested (Milestone 8, explicitly deferred):**
- `@react-three/drei-vanilla` exists as a Three.js-only (no React) helper package from the same maintainers (pmndrs) — it's the natural reference for porting `graph-renderer-three` patterns to a non-React consumer, since the underlying Three.js scene logic doesn't need to change, only the component-lifecycle glue.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `@react-three/fiber@9.6.1` | `react@>=19 <19.3`, `react-dom@>=19 <19.3`, `three@>=0.156` | Fiber 9.x's React peer range has an explicit upper bound (`<19.3`) — do not blindly bump React past what fiber declares support for; check fiber's peerDependencies again before any React version bump. |
| `@react-three/drei@10.7.7` | `react@^19`, `react-dom@^19`, `three@>=0.159`, `@react-three/fiber@^9.0.0` | Drei 10.x requires fiber 9.x — these two must be upgraded together, never independently. |
| `@react-three/postprocessing@3.0.4` | `@react-three/fiber@^9.0.0`, `react@^19.0`, `three@>=0.156.0` | Same fiber-9/React-19 family; safe to add later without a stack-wide version bump, as long as fiber/drei/three stay on the versions above. |
| `tsup@8.5.1` | Node (esbuild-based, no special peer constraints) | `--experimental-dts` requires installing `@microsoft/api-extractor` separately if you outgrow the default `--dts` flag. |
| `vitest@4.1.10` | `vite@8.x` (shares config resolution) | Keep Vitest and Vite major versions moving together; Storybook's `@storybook/react-vite` also shares this Vite dependency, so bump all three (`vite`, `vitest`, `@storybook/react-vite`) as a set. |
| `@changesets/cli@2.31.0` | pnpm workspaces | Works natively with pnpm's `workspace:*` protocol for internal cross-package dependencies (e.g., `react-knowledge-graph` depending on `graph-core` and `graph-renderer-three`) — changesets correctly bumps these on publish. |

## Sources

- `/pmndrs/react-three-fiber` (Context7) — pointer events/raycasting API, render-loop internals. Confidence: MEDIUM.
- `/pmndrs/drei` (Context7) — `Html`, `Text`, `Instances`/`createInstances`, `OrbitControls`/`TransformControls` interaction. Confidence: MEDIUM.
- `/mrdoob/three.js` (Context7) — `InstancedMesh` API and performance model. Confidence: MEDIUM.
- `/egoist/tsup` (Context7) — multi-format bundling, `.d.ts` generation, `--experimental-dts`. Confidence: MEDIUM.
- `/vitest-dev/vitest` (Context7) — test environments (`jsdom`/`happy-dom`), React Testing Library integration, Browser Mode. Confidence: MEDIUM.
- `/storybookjs/storybook` (Context7) — `@storybook/react-vite` setup, pnpm workspace/monorepo `reactDocgenTypescriptOptions.include` gotcha. Confidence: MEDIUM.
- `/changesets/changesets` (Context7) — `changeset init`/`version`/`publish`, `fixed` vs `linked` package groups. Confidence: MEDIUM.
- npm registry, direct `npm view <pkg> version|peerDependencies|dependencies|engines` queries (2026-07-08) for: `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `zustand`, `tsup`, `tsdown`, `vitest`, `storybook`, `@storybook/react-vite`, `@changesets/cli`, `typescript`, `zod`, `d3-force-3d`, `ngraph.forcelayout`, `ngraph.graph`, `reagraph`, `react-force-graph-3d`, `eslint`, `typescript-eslint`, `prettier`, `turbo`, `pnpm`, `vite`, `@testing-library/react`, `happy-dom`. This is the authoritative source for every version number in this document — treat as HIGH confidence for version accuracy even though the tool's generic confidence classifier has no dedicated "npm registry" tier.
- Web search (LOW confidence, unverified against primary sources — treat as directional only): "best practices publishing React component npm package... 2026" (ESM-only trend discussion); "force-directed graph layout library... d3-force-3d ngraph.forcelayout comparison"; "react-force-graph 3d-force-graph library architecture npm knowledge graph visualization" (surfaced `reagraph` as a relevant prior-art alternative).
- Project docs read as required context: `.planning/PROJECT.md`, `docs/03-architecture.md`, `docs/04-data-model.md`.

---
*Stack research for: React 3D knowledge-graph visualization library*
*Researched: 2026-07-08*
