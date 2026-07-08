# Architecture Research

**Domain:** Reusable graph-visualization / data-viz component library (React + Three.js, monorepo)
**Researched:** 2026-07-08
**Confidence:** HIGH (project docs are the binding spec) / MEDIUM (ecosystem cross-check, 3 independent verified precedents)

## Standard Architecture

This is not a novel shape. Every mature graph/diagram visualization library that supports multiple frameworks or multiple data sources converges on the same layered split: **framework-agnostic core → renderer → framework binding**, with **adapters** kept outside the core dependency graph entirely. The project's own `docs/03-architecture.md` already specifies exactly this shape for `graph-core` / `graph-renderer-three` / `react-knowledge-graph` / `adapters/*`. Ecosystem research confirms it is the correct, well-trodden pattern — not a documentation-only fantasy that will need revision once real code lands.

**Verified precedents (cross-checked, MEDIUM confidence):**

| Project | Core (framework/render-agnostic) | Framework/render binding | Notes |
|---|---|---|---|
| xyflow (React Flow / Svelte Flow) | `@xyflow/system` — no React/Svelte dependency | `@xyflow/react`, `@xyflow/svelte` | pnpm workspaces, shared Rollup config package, `workspace:*` protocol |
| sigma.js + graphology | `graphology` — pure graph data structure, no rendering | `sigma` (WebGL renderer), `@react-sigma/core` (React wrapper) | Model/render split is a hard architectural boundary, not a convenience split |
| vasturiano force-graph family | `3d-force-graph` (Three.js/WebGL, framework-agnostic) | `react-force-graph-3d` (thin React wrapper) | Same core reused across 2D/3D/VR/AR variants |

This project's `graph-core` maps to `@xyflow/system`/`graphology`; `graph-renderer-three` maps to `3d-force-graph`/`sigma`; `react-knowledge-graph` maps to `@xyflow/react`/`@react-sigma/core`/`react-force-graph-3d`. The pattern is validated by three independent, unrelated ecosystems arriving at the same boundary — this is strong evidence it's the right shape, not just internally consistent documentation.

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Consuming Application                        │
│   owns: data fetching, auth, transport, source-of-truth state    │
└───────────────────────────┬───────────────────────────────────────┘
                            │ props only: { nodes, edges, theme, ... }
                            │ (never apiUrl — ADR 0003)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│         react-knowledge-graph  (public npm package)               │
│  <KnowledgeGraphViewer/>, useGraphSelection, useGraphSearch,      │
│  useGraphFilters, useGraphCamera, useGraphStats, theming, panels  │
├─────────────────────────────────────────────────────────────────┤
│         graph-renderer-three  (rendering layer)                   │
│  Three.js/R3F scene, camera, controls, node/edge meshes,          │
│  hit-testing, hover/selection, animation                          │
├─────────────────────────────────────────────────────────────────┤
│         graph-core  (pure data/logic layer — zero UI deps)        │
│  GraphNode/GraphEdge/NormalizedGraph types, validation,           │
│  ID normalization, filter/group/stat utilities                   │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │ produces NormalizedGraph
                            │ (never imported BY react-knowledge-graph)
┌─────────────────────────────────────────────────────────────────┐
│                        adapters/*  (integration layer)            │
│  adapters/codebase-memory   fromCodebaseMemory()                  │
│  adapters/graphology        fromGraphology()                      │
│  adapters/neo4j             fromNeo4jRecords()                    │
│  each depends only on graph-core (for target types)               │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `graph-core` | Neutral data contract (`GraphNode`/`GraphEdge`/`NormalizedGraph`), schema validation, ID normalization, filter/group/stat utilities | Plain TypeScript, zero runtime deps beyond a validation lib (e.g. Zod) if any; ships as ESM+CJS dual build; this package is the one every other package depends on and it depends on nothing |
| `graph-renderer-three` | Turns `NormalizedGraph` + render/layout options into a live Three.js scene: node/edge meshes, camera, controls, raycasting for hover/click, animation loop, visual effects | React Three Fiber recommended over raw Three.js imperative code (project already targets R3F per constraints); exposes an imperative-ish API or R3F components consumed only by `react-knowledge-graph`, never directly by end users |
| `react-knowledge-graph` | Public surface: `<KnowledgeGraphViewer/>`, hooks, event wiring, theming, optional panels (Inspector/SearchBox/Legend) | React component library; owns *rendering-related* UI state (selection, hover, camera) via hooks; never owns the graph data itself — that's supplied via props every render |
| `adapters/{codebase-memory,graphology,neo4j}` | One-way, pure conversion functions from a specific external shape to `NormalizedGraph` | Zero side effects, zero framework deps; each ships as its own npm package so a consumer who only needs the Neo4j adapter doesn't pull in MCP-specific code |
| Layout algorithms (future, not yet a package) | Position calculation (force-directed, hierarchical, etc.) | Currently deferred (Out of Scope); when it lands, treat it as a `graph-layout-*` package consumed by `graph-renderer-three`, not baked into the renderer or core |

## Recommended Project Structure

```
react-knowledge-graph/                 # monorepo root
├── packages/
│   ├── graph-core/
│   │   ├── src/
│   │   │   ├── types.ts               # GraphNode, GraphEdge, NormalizedGraph
│   │   │   ├── validate.ts            # schema validation, orphan-edge checks
│   │   │   ├── normalize.ts           # ID normalization, dedupe
│   │   │   ├── filter.ts              # filtering/grouping utilities
│   │   │   ├── stats.ts               # basic graph statistics
│   │   │   └── index.ts               # public exports
│   │   ├── package.json               # name: @gruporeacciona/graph-core, zero UI deps
│   │   └── tsconfig.json
│   ├── graph-renderer-three/
│   │   ├── src/
│   │   │   ├── scene/                 # scene setup, camera, controls
│   │   │   ├── nodes/                 # node mesh/material logic
│   │   │   ├── edges/                 # edge/line rendering
│   │   │   ├── interaction/           # hover, click, selection (raycasting)
│   │   │   ├── animation/             # transitions, effects
│   │   │   └── index.ts
│   │   ├── package.json               # deps: graph-core, three, @react-three/fiber, @react-three/drei
│   │   └── tsconfig.json
│   ├── react-knowledge-graph/
│   │   ├── src/
│   │   │   ├── KnowledgeGraphViewer.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useGraphSelection.ts
│   │   │   │   ├── useGraphSearch.ts
│   │   │   │   ├── useGraphFilters.ts
│   │   │   │   ├── useGraphCamera.ts
│   │   │   │   └── useGraphStats.ts
│   │   │   ├── panels/                # GraphInspector, GraphSearchBox, GraphLegend (optional)
│   │   │   ├── theme/
│   │   │   └── index.ts
│   │   ├── package.json               # deps: graph-core, graph-renderer-three, react (peer)
│   │   └── tsconfig.json
│   └── adapters/
│       ├── codebase-memory/
│       │   ├── src/fromCodebaseMemory.ts
│       │   └── package.json           # deps: graph-core only
│       ├── graphology/
│       │   ├── src/fromGraphology.ts
│       │   └── package.json           # deps: graph-core, (peer) graphology
│       └── neo4j/
│           ├── src/fromNeo4jRecords.ts
│           └── package.json           # deps: graph-core, (peer) neo4j-driver types
├── examples/
│   ├── basic-react/                   # minimal <KnowledgeGraphViewer/> demo, mock data
│   ├── codebase-memory-adapter/       # demo wiring an adapter end-to-end
│   └── large-graph/                   # performance/stress demo (later milestone)
├── docs/                              # existing design docs (already present)
├── package.json                       # workspace root, shared dev tooling
├── pnpm-workspace.yaml                # or equivalent workspace manifest
└── tsconfig.base.json                 # shared compiler options
```

### Structure Rationale

- **`packages/graph-core/`:** Isolated first because every other package imports it. Keeping it dependency-free (no React, no Three.js) is what makes the renderer swappable later (Sigma.js/2D) and what makes adapters trivial to write without dragging in rendering code.
- **`packages/graph-renderer-three/`:** Separated from `react-knowledge-graph` even though React Three Fiber is React-based — this boundary is what the project's own roadmap (Milestone 8, alternate renderer) depends on. If R3F and the public component were merged into one package, swapping renderers later would mean a breaking rewrite instead of a new sibling package.
- **`packages/react-knowledge-graph/`:** The only package meant to be imported directly by end consumers. Everything it needs (types + renderer) comes through its two dependencies; it adds no rendering logic of its own beyond wiring props/hooks to the renderer.
- **`packages/adapters/*`:** Deliberately siblings of, not children of, `react-knowledge-graph`. Each is its own publishable package so a Neo4j-only consumer never pulls in `codebase-memory`-specific code or dependencies. This mirrors how `graphology`'s satellite libraries and xyflow's adapters are structured.
- **`examples/`:** Runnable demo apps, not documentation snippets — they double as manual integration tests and as the fastest way to verify a phase's "it renders" acceptance criterion.

## Architectural Patterns

### Pattern 1: Neutral Data Model / Adapter Pattern

**What:** One canonical `NormalizedGraph { nodes, edges }` shape that the entire rendering stack understands. External formats (MCP graphs, Neo4j records, Graphology instances) are converted to it by dedicated, pure adapter functions before they ever reach the viewer.
**When to use:** Any time a component must support more than one upstream data source without hard-coding knowledge of any of them.
**Trade-offs:** Adds one conversion step for every integration, but is what makes `graph-core`/`react-knowledge-graph` reusable at all. Skipping this (accepting raw Neo4j records directly in the viewer, for example) is the single most common mistake in this domain — it silently re-couples the "reusable" library to one backend.

**Example:**
```ts
// packages/adapters/neo4j/src/fromNeo4jRecords.ts
import type { NormalizedGraph } from '@gruporeacciona/graph-core';

export function fromNeo4jRecords(records: Neo4jRecord[]): NormalizedGraph {
  // pure transform, no side effects, no network calls
  return { nodes: [...], edges: [...] };
}
```

### Pattern 2: Props-In / Callbacks-Out (No Internal Fetching)

**What:** The public component never fetches data itself and never leaks internal rendering objects through its API. Data flows in via props (`nodes`, `edges`); interaction flows out via callbacks carrying domain objects (`GraphNode`, `GraphEdge`), never `THREE.Mesh` or scene-graph internals.
**When to use:** Always, for any component meant to be embedded in arbitrary host applications with their own data-fetching/auth strategy.
**Trade-offs:** Consumers must manage their own loading/error states around the component — this is correct, not a gap, because it keeps the library transport- and auth-agnostic. Already codified as ADR 0003 in this project; do not relitigate it.

**Example:**
```tsx
// Incorrect — couples the library to transport
<KnowledgeGraphViewer apiUrl="/api/graph" />

// Correct — pure data-in
<KnowledgeGraphViewer nodes={nodes} edges={edges} onNodeClick={(node: GraphNode) => ...} />
```

### Pattern 3: Layered/Onion Dependency Direction

**What:** Strict one-directional dependency graph: `adapters` and `react-knowledge-graph` → `graph-renderer-three` → `graph-core` → (nothing). No package below in this chain may import from a package above it.
**When to use:** Any monorepo where multiple consumer-facing packages must share one source of truth without circular coupling.
**Trade-offs:** Requires discipline (and ideally a lint rule / dependency-cruiser check) to prevent `graph-core` from accidentally importing a React type or a Three.js helper "just this once." The payoff is that `graph-core` can be unit-tested in Node with zero DOM/WebGL mocking, which is exactly the kind of fast, isolated test suite the project's TDD workflow depends on.

## Data Flow

### Primary Rendering Path

```
Backend / file / graph DB (outside library scope)
    ↓
Adapter: fromX(source) → NormalizedGraph          [packages/adapters/*]
    ↓
Consuming app: <KnowledgeGraphViewer nodes edges .../>
    ↓
react-knowledge-graph: validate/normalize via graph-core
    ↓
graph-renderer-three: build/update Three.js scene from NormalizedGraph + options
    ↓
User interaction (click/hover) → translated back to GraphNode/GraphEdge
    ↓
Callback props (onNodeClick, onNodeHover, onSelectionChange) fire in consuming app
```

### State Management

```
Consuming app owns: source-of-truth graph data (nodes/edges), re-renders on data change
    ↓ props (every render)
react-knowledge-graph owns: rendering-related UI state, scoped per hook, per instance
    - useGraphSelection   → selected node/edge ids
    - useGraphSearch      → active query, matched node ids
    - useGraphFilters     → active filter predicates
    - useGraphCamera      → camera position/target
    - useGraphStats       → derived counts/metrics (delegates to graph-core stats utils)
```

### Key Data Flows

1. **Cold render:** consuming app passes initial `nodes`/`edges` → `graph-core` validates → `graph-renderer-three` builds the scene once → renderer mounts.
2. **Data update:** consuming app passes new `nodes`/`edges` (e.g., after a fetch) → `graph-core` re-validates/diffs → `graph-renderer-three` updates only the changed meshes (avoid full scene teardown/rebuild for large graphs — this is where a later milestone's performance work at 1k–10k nodes will focus).
3. **Interaction:** user clicks a mesh in the Three.js scene → renderer raycasts → resolves to a `GraphNode`/`GraphEdge` id → looks it up in the current `NormalizedGraph` → fires the matching callback prop with the domain object, never the mesh.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Small graphs (tens–hundreds of nodes, current milestone) | Naive per-node mesh + full-scene rebuild on data change is fine; correctness of the core/renderer split matters far more than performance right now |
| Medium graphs (1k–10k nodes, explicit later milestone) | Instanced meshes (`THREE.InstancedMesh`) instead of one mesh per node; diffing updates instead of rebuilding; this lives entirely inside `graph-renderer-three` and should not change the `graph-core` contract or the public component API |
| Large graphs (10k+ nodes) | Out of explicit scope for now (project is not competing with Cytoscape/Sigma as an analytical 2D tool); if ever pursued, would justify the already-anticipated `graph-renderer-three-core` / `graph-renderer-r3f` split and possibly an alternate 2D renderer package, per the roadmap's Milestone 8 framing |

### Scaling Priorities

1. **First bottleneck:** per-frame render cost of one draw call per node/edge once graphs exceed a few hundred elements — fix with instancing inside `graph-renderer-three`, no cross-package changes needed if the boundary is respected.
2. **Second bottleneck:** full scene teardown/rebuild on every prop update — fix with an internal diffing layer between `NormalizedGraph` and the live scene graph, still contained inside `graph-renderer-three`.

## Anti-Patterns

### Anti-Pattern 1: Fetching Data Inside the Viewer

**What people do:** Add an `apiUrl` prop or an internal `useEffect`+`fetch` to `KnowledgeGraphViewer` "for convenience."
**Why it's wrong:** Violates ADR 0003, permanently couples the reusable package to one transport/auth model, and blocks reuse across MCP/Neo4j/Graphology/GraphRAG sources — the entire reason this extraction exists.
**Do this instead:** Data loading and adapter conversion happen in the consuming application; the library stays props-in/callbacks-out.

### Anti-Pattern 2: Leaking Renderer Internals Through the Public API

**What people do:** An event handler passes a `THREE.Mesh`, `THREE.Intersection`, or R3F-specific object to a callback prop instead of the normalized domain object.
**Why it's wrong:** Breaks the renderer-swap goal (a future Sigma.js/2D renderer becomes impossible without a breaking change) and forces every consumer to learn Three.js internals just to handle a click.
**Do this instead:** Always resolve back to `GraphNode`/`GraphEdge` before invoking `onNodeClick`/`onNodeHover`/etc.

### Anti-Pattern 3: Importing Adapters From the Core Viewer Package

**What people do:** `react-knowledge-graph` imports `packages/adapters/codebase-memory` directly to offer a one-import "convenience" API.
**Why it's wrong:** Re-introduces MCP-specific dependencies into a general-purpose package and defeats the adapter pattern's whole point — every adapter must stay opt-in and independently installable.
**Do this instead:** Consumers import and compose adapters explicitly: `import { fromCodebaseMemory } from '@gruporeacciona/graph-adapter-codebase-memory'`.

### Anti-Pattern 4: Merging Core and Renderer Into One Package "For Now"

**What people do:** Skip the `graph-core`/`graph-renderer-three` split early on, reasoning "it's all internal, we'll split it later if needed."
**Why it's wrong:** Every verified precedent (xyflow, sigma/graphology, force-graph family) shows this split is foundational, not incidental — retrofitting it after `react-knowledge-graph` and rendering logic are entangled is a rewrite, not a refactor. It's also what makes `graph-core` unit-testable without a WebGL/DOM environment.
**Do this instead:** Create the split from the first implementation commit, even if `graph-renderer-three` is thin initially.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Codebase Memory MCP | `adapters/codebase-memory` converts its internal graph format to `NormalizedGraph` | This is also the licensing-sensitive path (MIT provenance) — keep conversion logic separate from the ported 3D viewer code so attribution stays traceable |
| Neo4j | `adapters/neo4j` converts query result records (`neo4j-driver` `Record[]`) to `NormalizedGraph` | Treat `neo4j-driver` as a peer dependency of the adapter package only, never a dependency of `graph-core` or `react-knowledge-graph` |
| Graphology | `adapters/graphology` converts a `Graph` instance to `NormalizedGraph` | Graphology itself is a strong architectural precedent for this whole project (see Standard Architecture table above) — worth reviewing its `standard-library` conventions when designing this adapter |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `graph-core` ↔ `graph-renderer-three` | Direct function/type imports (`NormalizedGraph`, validators) | One-directional only; renderer imports core, never the reverse |
| `graph-renderer-three` ↔ `react-knowledge-graph` | React component composition + typed callback props | The public component wraps the renderer; renderer never imports the public package |
| `react-knowledge-graph` ↔ consuming application | Public props/callbacks (`KnowledgeGraphViewerProps`) | Only sanctioned integration surface; treat as a versioned public API contract from the first release |
| `adapters/*` ↔ everything else | One-way, called explicitly by the consuming app, never imported by library packages | Enforces the opt-in integration model |

## Build Order Implications

Dependency direction dictates implementation order — each package below only needs packages already built above it:

1. **`graph-core` first, always.** Nothing else can be meaningfully implemented or tested until `NormalizedGraph`, `GraphNode`, `GraphEdge`, and validation exist. This is also the cheapest package to get right in isolation (pure TypeScript, fast unit tests, no DOM/WebGL).
2. **`graph-renderer-three` second.** Depends only on `graph-core` and rendering libraries (`three`, `@react-three/fiber`). Can be developed and visually verified against hand-written mock `NormalizedGraph` fixtures before any adapter exists.
3. **`react-knowledge-graph` third.** Wraps the renderer; this is where the ported 3D viewer code from `codebase-memory-mcp` actually lands (per the project's extraction plan), now consuming the neutral model instead of MCP-specific data. This is the package validated by the project's own Milestone 1–3 scope (mock data first, real decoupling second).
4. **`adapters/*` last, and in parallel with each other.** Each adapter only needs `graph-core`'s finished types; the three adapters (`codebase-memory`, `graphology`, `neo4j`) have no dependencies on one another and can be built concurrently once `graph-core` is stable. This matches the project's own scoping — adapters are explicitly deferred to a later milestone (Milestone 6) after the core/component work (Milestones 1–3) lands.

This ordering is also why the project's own `PROJECT.md` scopes Milestones 1–3 to "repo base, minimal React component, real decoupling in graph-core" before touching adapters at all — the architecture and the roadmap are already aligned; no architectural rework is implied by that sequencing.

## Sources

- `docs/03-architecture.md` (this repo) — binding architecture spec, HIGH confidence (project's own design contract)
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md` (this repo) — current-state mapping confirming zero implementation exists yet, HIGH confidence
- `.planning/PROJECT.md` (this repo) — scope/milestone boundaries, HIGH confidence
- [xyflow/xyflow — Package Architecture (DeepWiki)](https://deepwiki.com/xyflow/xyflow/1.1-package-architecture) — MEDIUM confidence, cross-verified precedent for core/framework-binding split (`@xyflow/system` + `@xyflow/react`/`@xyflow/svelte`)
- [sigma.js official site](https://www.sigmajs.org/) and [jacomyal/sigma.js (GitHub)](https://github.com/jacomyal/sigma.js/) — MEDIUM confidence, cross-verified precedent for graph-model/renderer separation (`graphology` + `sigma` + `@react-sigma/core`)
- [vasturiano/react-force-graph (GitHub)](https://github.com/vasturiano/react-force-graph) and [vasturiano/3d-force-graph (GitHub)](https://github.com/vasturiano/3d-force-graph) — MEDIUM confidence, cross-verified precedent for framework-agnostic Three.js core reused by a thin React wrapper

---
*Architecture research for: React knowledge-graph visualization library (core/renderer/adapter monorepo)*
*Researched: 2026-07-08*
