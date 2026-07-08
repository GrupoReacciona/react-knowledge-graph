# Feature Research

**Domain:** React/JS knowledge-graph and network-graph visualization libraries (Cytoscape.js, Sigma.js, react-force-graph, vis-network, Reagraph, Neo4j Bloom/Linkurious)
**Researched:** 2026-07-08
**Confidence:** LOW-MEDIUM (web search only, no Context7/verified docs cross-check this pass; findings are internally consistent across multiple independent sources and align with the project's own `docs/01-07`, which raises practical confidence — see Confidence Assessment)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any graph/network visualization component. Missing these makes `<KnowledgeGraphViewer>` feel broken or unfinished, regardless of how good the 3D rendering looks.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Node click / hover events | Every reviewed library (Cytoscape.js, vis-network, Sigma.js, react-force-graph, Reagraph) exposes click and hover as first-class events | LOW | Already in scope: `onNodeClick`, `onNodeHover`, `onNodeDoubleClick`, `onEdgeClick` (docs/05) |
| Pan / zoom / camera control | Universal across 2D and 3D graph tools; in 3D specifically, orbit/trackball/fly camera modes are standard (react-force-graph-3d) | LOW-MEDIUM | `GraphCameraOptions` already scoped (docs/05); R3F + drei `OrbitControls` covers this cheaply |
| Node/edge selection (single + multi) | Box/lasso selection and click-to-select are baseline in Cytoscape.js, Reagraph, vis-network | LOW-MEDIUM | `GraphSelectionOptions` / `onSelectionChange` already scoped (docs/05); multi-select can start single-select-only for MVP |
| Node dragging | Cytoscape.js, vis-network, react-force-graph, Reagraph all support drag-to-reposition | LOW-MEDIUM | Not yet in the documented API — should be flagged as an MVP gap if omitted, users expect to nudge nodes |
| Visual encoding by data (color/size by attribute) | `nodeColor`, `nodeSize`, `edgeColor`, `edgeWidth` as static value or accessor function is standard across every library reviewed | LOW | Already scoped in `GraphRenderOptions` (docs/05) — good alignment |
| Labels (always/hover/selected modes) | All libraries offer label visibility strategies; showing all labels at once is universally called out as unusable past a few hundred nodes | LOW | Already scoped: `showLabels`/`showEdgeLabels` as `boolean | 'hover' | 'selected'` (docs/05) — matches Milestone 5's "labels by hover/selección" |
| Basic force-directed layout | Every library defaults to a force-directed / spring layout (Cytoscape COSE, vis-network ForceAtlas2Based, d3-force-3d) | MEDIUM | `layout.mode: 'force-3d'` already scoped; this is the layout users expect out of the box, not radial/clustered |
| Neighbor highlighting on hover/select | Called out repeatedly as core graph-exploration UX (Cambridge Intelligence, Reagraph "Highlight and Selection Hook") | LOW-MEDIUM | Matches Milestone 4 "Resaltado de vecinos" — correctly deferred but should not be considered optional long-term |
| Theming (light/dark) | Reagraph, Neo4j Bloom, and most modern tools ship light/dark or custom theme support | LOW | Already scoped: `theme?: 'light' | 'dark' | GraphTheme'` (docs/05) |
| Empty/loading/error states for the viewer | Not graph-specific, but any data-driven component needs these; absence causes silent blank-canvas confusion | LOW | Not mentioned in docs/05 — should be added to the component contract explicitly |

### Differentiators (Competitive Advantage)

Not required for a minimally usable graph viewer, but this is where `react-knowledge-graph` can stand out — especially against Cytoscape.js/vis-network (2D, not React-native) and generic react-force-graph (backend-agnostic but not knowledge-graph-flavored).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Backend-neutral adapter layer (Codebase Memory MCP, Graphology, Neo4j, generic JSON) | No reviewed library ships first-class adapters for this specific set of knowledge-graph backends; this is the project's stated core value (PROJECT.md) | MEDIUM-HIGH | Matches Milestone 6; this is the single biggest differentiator versus Cytoscape.js/Sigma.js/vis-network, which are all backend-agnostic in a generic, unopinionated way |
| React-first API with typed props (not an imperative wrapper) | Cytoscape.js and vis-network are imperative-core libraries retrofitted into React; Reagraph and react-force-graph are the only truly React-native comparables | MEDIUM | Already the architectural bet (docs ADR 0001) — genuinely differentiating versus the Cytoscape/vis-network ecosystem, less so versus Reagraph |
| 3D rendering via Three.js/R3F with visual polish (bloom, particles) | `enableBloom`/`enableParticles` already scoped (docs/05); most 2D-first libraries (Cytoscape.js, vis-network) can't match this, and even react-force-graph-3d requires manual Three.js object composition | MEDIUM | Real aesthetic differentiator for a "knowledge exploration" use case, not just an analytics tool — but must not come at the cost of Milestone 5 performance targets |
| Inspector panel with rich node/edge detail on demand | Neo4j Bloom's "Inspection" and Reagraph's context menu are the closest comparables; a first-class `<GraphInspector>` optional component (docs/05) is a differentiator if well-designed for knowledge-graph metadata (code refs, provenance, embeddings) | LOW-MEDIUM | Matches Milestone 4; keep as an optional companion component, not baked into the core viewer (per docs/05 constraint) |
| Search with near-natural-language or fuzzy matching | Neo4j Bloom's search-to-visualization is its headline feature; most JS libraries only offer exact/substring node search | MEDIUM-HIGH | Milestone 4 scopes basic search — fuzzy/NL search is a legitimate v2 differentiator, not MVP |
| GraphRAG / LLM-memory-specific node kinds and styling presets | No reviewed library has opinionated presets for GraphRAG, Mem0/Graphiti-style memory graphs — this is a genuinely underserved niche per PROJECT.md's target domains | MEDIUM | Achievable via `groupBy`/`nodeColor` accessor functions already in the API; ship as example presets, not new API surface |
| Level-of-detail / progressive disclosure at scale | KeyLines and Sigma.js treat this as a premium capability; most open-source options only partially solve it | HIGH | Matches Milestone 5; genuinely hard — this is where the project can either shine or stall (see PITFALLS-adjacent risk) |
| Clustering (community detection or attribute-based) | Reagraph ships `d3-force-cluster-3d`-based clustering as an advanced feature; Cytoscape.js requires plugins | MEDIUM-HIGH | Not yet in roadmap explicitly — worth adding as a Milestone 5/8 candidate since it directly mitigates the "look like a hairball at 1k+ nodes" problem |
| Export (PNG/SVG) and "presentation mode" | Common in commercial tools (KeyLines, Tom Sawyer, Bloom) but rare/manual in open-source JS libraries | LOW-MEDIUM | Already correctly placed in Milestone 8 — nice-to-have, not urgent |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Built-in graph editing (add/remove/rewrite nodes and edges in the UI) | Neo4j Bloom and Linkurious both support "add nodes/edit properties without code," and users often ask "can I edit the graph here?" | Turns a *visualization* component into a *graph editor*, which requires write-back to arbitrary backends (MCP/SQLite/Neo4j/Graphology) — directly violates the neutral, backend-agnostic model (PROJECT.md constraint: "no acoplar a MCP, SQLite, ASTs o repositorios Git") | Emit `onNodeClick`/`onSelectionChange` and let the *host app* implement editing against its own backend; the viewer stays read-only |
| A full custom layout engine (proprietary force/hierarchical algorithms) | Competing head-on with Cytoscape.js/Sigma.js layout ecosystems feels natural once building a "serious" graph tool | Layout algorithms are a deep, mature research area (d3-force, ForceAtlas2, COSE); building one from scratch burns the whole roadmap and duplicates what react-force-graph/d3-force-3d/Graphology already solve well | Delegate to existing layout libraries (d3-force-3d already implied by the Three.js/R3F stack) via the `layout.mode` enum; only add new modes when a real gap appears — matches PROJECT.md's explicit "no motor de layouts avanzado propio desde el día uno" |
| Trying to match Sigma.js/Cytoscape.js as a general-purpose 2D analytics tool (full Cypher-style querying, geospatial layouts, timeline slicers) | Neo4j Bloom/Linkurious offer these, and it's tempting to "keep up" feature-for-feature | Explicitly out of scope per PROJECT.md ("Competir directamente con Cytoscape.js/Sigma.js... no es el objetivo"); each of these is its own multi-month feature investment (e.g., Bloom's Slicer, Linkurious's geospatial layouts) with a different target user (analysts, not engineering teams exploring code/knowledge graphs) | Stay focused on the code/knowledge-graph exploration niche; expose enough hooks (`useGraphFilters`, `groupBy`) that power users can build their own filtering UI on top |
| Real-time/live-updating graph sync (streaming node/edge diffs) | Feels like a natural "advanced" feature once adapters (Milestone 6) exist for live backends like Neo4j | Adds a whole new state-management and animation-transition problem (diffing, node re-entry/exit animations, layout stability under mutation) that isn't validated as needed by any Active requirement; PROJECT.md's constraint is "sin acoplarse... a ningún backend específico," and real-time sync inherently couples to backend semantics (subscriptions, polling) | Keep the component prop-driven (`nodes`/`edges` as plain arrays); if a host app wants live updates, it re-renders with new arrays — defer true incremental/animated diffing to a future milestone only if requested |
| Rendering all labels, all the time, regardless of node count | Seems like the "complete" and "readable" option — show everything | Every reviewed source flags this as unusable past a few hundred nodes (visual clutter, GPU/CPU label-layout cost); directly contradicts Milestone 5's own performance goals | Use `showLabels: 'hover' | 'selected'` as the practical default (already scoped in docs/05); reserve `true` for small graphs |

## Feature Dependencies

```
Neutral graph model (graph-core: GraphNode/GraphEdge + validation)
    └──requires (blocks everything below)──> Minimal <KnowledgeGraphViewer> (nodes/edges render)
                                                  └──enables──> Node/edge click, hover, selection events
                                                  └──enables──> Camera control (pan/zoom/orbit)
                                                  └──enables──> Visual encoding (color/size by attribute)

Node/edge selection + hover
    └──requires──> Neighbor highlighting (needs to know which edges touch the selected/hovered node)
    └──requires──> Inspector panel (`<GraphInspector node={selectedNode} />`)

Label visibility strategy (hover/selected modes)
    └──requires──> Selection + hover events (same dependency as above)

Search (node search, `useGraphSearch`)
    └──enhances──> Camera centering on node ("Centrado de cámara en nodo," Milestone 4)
    └──enhances──> Selection (search result → select node)

Filtering (`useGraphFilters`, filter by kind/group)
    └──requires──> `groupBy` already present in layout options (docs/05) for grouping semantics to be meaningful
    └──enables──> Clustering (attribute-based clustering reuses the same `groupBy` concept)

Performance work (level of detail, label simplification, edge simplification)
    └──requires──> Label visibility strategy (LOD reuses the hover/selected label logic)
    └──requires──> Neutral graph model (LOD decisions need consistent node/edge shape to batch/instance efficiently)
    └──conflicts with──> "always show all labels" anti-feature (Milestone 5 goal directly negates this)

Adapters (Codebase Memory MCP, Graphology, Neo4j, generic JSON)
    └──requires──> Neutral graph model (adapters only make sense once graph-core has no backend coupling — this is Milestone 3's job, and Milestone 6 depends on it)

Clustering (community detection or attribute-based)
    └──requires──> Force-directed layout (Reagraph's clustering sits on top of `d3-force-cluster-3d`, i.e., it's an extension of the base layout, not independent)
    └──enhances──> Performance at scale (clustering is a mitigation for "hairball at 1k+ nodes," complementary to LOD)

Export (PNG/SVG) / presentation mode
    └──requires──> Stable camera + rendering pipeline (can't reliably export a scene whose camera/LOD behavior is still unstable)
    └──conflicts with──> Nothing directly, but low priority until rendering is stable — correctly placed last (Milestone 8)

Graph editing (anti-feature)
    └──conflicts with──> Neutral, read-only, backend-agnostic model (PROJECT.md constraint) — do not build
```

### Dependency Notes

- **Everything requires the neutral graph model first:** `graph-core`'s `GraphNode`/`GraphEdge` types and validation (Milestone 3) are the true foundation — even Milestone 2's "minimal component with mock data" should be built against these types from day one to avoid rework, per the project's own Milestone 3 goal of removing original-backend coupling.
- **Selection/hover is the hub dependency:** neighbor highlighting, the inspector panel, and label-visibility-on-selection all branch from the same click/hover/selection event plumbing already scoped in `KnowledgeGraphViewerProps` (docs/05). Get this right once, reuse everywhere.
- **Performance (Milestone 5) depends on label strategy and graph-core, not on UX features (Milestone 4):** the roadmap already sequences UX exploration (M4) before performance (M5), which matches how every reviewed competitor evolved (features first on small graphs, then hardening for scale) — this order is validated, not just convenient.
- **Adapters (M6) genuinely cannot start early:** they require the neutral model to be backend-free (M3) or every adapter would be fighting residual coupling. The existing roadmap ordering (M3 before M6) is correct per this research.
- **Clustering is not yet on the roadmap** — recommend inserting it as an explicit Milestone 5 or Milestone 8 item, since it's called out by multiple competitors (Reagraph, KeyLines, Sigma.js ecosystem) as the primary answer to "graph looks like a hairball," which LOD alone does not solve.

## MVP Definition

### Launch With (v1) — Milestones 1-3 per existing roadmap

Minimum viable product — validates that a backend-neutral React 3D graph viewer is usable at all.

- [ ] Neutral `GraphNode`/`GraphEdge` model with validation in `graph-core` — every other feature depends on this being right
- [ ] `<KnowledgeGraphViewer nodes edges />` rendering via R3F, decoupled from the original MCP/SQLite backend
- [ ] `onNodeClick`, `onNodeHover`, `onNodeDoubleClick`, `onEdgeClick` events (normalized `GraphNode`/`GraphEdge`, never raw Three.js objects — per docs/05's explicit correctness rule)
- [ ] Basic camera control (pan/zoom/orbit) — table stakes, low complexity given R3F
- [ ] Force-directed default layout (`layout.mode: 'force-3d'`)
- [ ] Basic visual encoding (`nodeColor`, `nodeSize`, `edgeColor`, `edgeWidth` as value or accessor)
- [ ] Label visibility strategy (`showLabels: 'hover' | 'selected'` as default, not `true`) — cheap to add now, expensive to retrofit once users depend on "always-on" labels
- [ ] Storybook/Vite examples with mock data

### Add After Validation (v1.x) — Milestones 4-5 per existing roadmap

Trigger for adding: v1 is usable but "exploring a graph of any real size is frustrating."

- [ ] Node search (`useGraphSearch`) + camera centering on result — trigger: users have real graphs (dozens+ nodes) and can't find things by eye
- [ ] Filter by `kind`/`group` (`useGraphFilters`) — trigger: same as above, graphs have heterogeneous node types
- [ ] Neighbor highlighting on selection — trigger: users ask "what connects to this node?"
- [ ] `<GraphInspector>` optional component — trigger: node metadata is richer than a label can show
- [ ] Performance hardening (LOD, label/edge simplification, benchmarks at 1k/5k/10k) — trigger: first real dataset above ~500 nodes causes visible lag
- [ ] Clustering (recommend adding here, not currently on roadmap) — trigger: performance work alone (LOD) doesn't solve visual legibility at 1k+ nodes

### Future Consideration (v2+) — Milestones 6-8 per existing roadmap

Features to defer until the core viewer and UX are validated.

- [ ] Adapters (Codebase Memory MCP, Graphology, Neo4j, generic JSON) — defer until graph-core is proven backend-free with real (not mock) data from at least one source
- [ ] Publication/versioning (semver, ESM/CJS build, README) — defer until API surface has stabilized through real usage internally
- [ ] 2D renderer via Sigma.js, export PNG/SVG, presentation mode — defer to Milestone 8, only if internal usage reveals real demand (matches PROJECT.md's own framing: "solo si hay demanda real")
- [ ] Vanilla JS version — explicitly deferred per PROJECT.md; do not build speculatively

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Neutral graph model + validation | HIGH | MEDIUM | P1 |
| Minimal viewer + click/hover events | HIGH | LOW | P1 |
| Camera control (pan/zoom/orbit) | HIGH | LOW | P1 |
| Visual encoding (color/size accessors) | HIGH | LOW | P1 |
| Label visibility strategy | MEDIUM | LOW | P1 |
| Force-directed layout | HIGH | MEDIUM | P1 |
| Node search + camera centering | HIGH | MEDIUM | P2 |
| Filter by kind/group | MEDIUM | MEDIUM | P2 |
| Neighbor highlighting | MEDIUM | LOW-MEDIUM | P2 |
| Inspector panel | MEDIUM | LOW-MEDIUM | P2 |
| Performance/LOD at 1k-10k nodes | HIGH (once graphs are real-sized) | HIGH | P2 |
| Clustering | MEDIUM-HIGH | MEDIUM-HIGH | P2/P3 |
| Backend adapters | HIGH (for adoption) | MEDIUM-HIGH | P3 |
| Export/presentation mode | LOW-MEDIUM | LOW-MEDIUM | P3 |
| Graph editing in-viewer | LOW (violates core constraint) | HIGH | Do not build |
| Custom layout engine from scratch | LOW (duplicates existing solutions) | HIGH | Do not build |

**Priority key:**
- P1: Must have for launch (Milestones 1-3)
- P2: Should have, add when possible (Milestones 4-5)
- P3: Nice to have, future consideration (Milestones 6-8)

## Competitor Feature Analysis

| Feature | Cytoscape.js | Sigma.js / react-force-graph | Reagraph (closest React+WebGL comparable) | Neo4j Bloom | Our Approach |
|---------|--------------|-------------------------------|--------------------------------------------|--------------|--------------|
| Rendering | Canvas/SVG, degrades ~10k nodes | WebGL (Sigma.js: 100k-500k nodes); react-force-graph-3d uses Three.js/WebGL | WebGL via Three.js/R3F, 2D+3D | GPU-powered, proprietary | Three.js/R3F (reused from `codebase-memory-mcp`), 3D-first, defer 2D to M8 |
| React integration | Imperative wrapper (not React-native) | react-force-graph is a thin React wrapper; Sigma.js needs `react-sigma` | Fully React-native, typed hooks | N/A (desktop/browser app, not embeddable) | Fully React-native, typed props (docs/05) — matches Reagraph's approach, ahead of Cytoscape/Sigma |
| Layout | Rich algorithm library (COSE, etc.) | d3-force-3d default | Multiple built-in layouts incl. tree, circular, force 2D/3D | Perspective-driven, not force-layout-centric | Force-3d default only for v1; radial/clustered/static deferred (already scoped, correct) |
| Selection/highlight | Box selection, rich gestures | Click/hover/drag | Lasso selection, highlight+selection hook, radial context menu | Click-to-explore, inspection panel | Click/hover/select events scoped; box/lasso selection is a reasonable v1.x addition |
| Search | Plugin-based | Not built-in | Not a headline feature | Near-natural-language search (headline feature) | Basic node search (`useGraphSearch`) in M4; fuzzy/NL search is a legitimate later differentiator, not MVP |
| Clustering | Plugin-based (e.g., cise, markov-clustering) | Not built-in to Sigma.js core | Built-in (`d3-force-cluster-3d`) | Not a core feature (Bloom relies on perspectives/filters) | Not yet scoped — recommend adding to M5/M8 as differentiator vs. Cytoscape/Sigma |
| Backend adapters | None (bring-your-own-data) | None | None (Graphology/D3 data helpers only) | Neo4j-only (by design) | Multi-backend adapters (MCP, Graphology, Neo4j, JSON) — this is the project's unique wedge |
| Export | Plugin-based | Not built-in | Not a headline feature | Not confirmed as core | PNG/SVG export deferred to M8, matches low competitive urgency |

## Sources

- [Cytoscape.js vs vis-network vs Sigma.js 2026: Graph Visualization Decision Guide — PkgPulse](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026)
- [The Best Libraries and Methods to Render Large Force-Directed Graphs on the Web — Medium](https://weber-stephen.medium.com/the-best-libraries-and-methods-to-render-large-network-graphs-on-the-web-d122ece2f4dc)
- [Cytoscape.js official site](https://js.cytoscape.org/)
- [You Want a Fast, Easy-To-Use, and Popular Graph Visualization Tool? Pick Two! — Memgraph](https://memgraph.com/blog/you-want-a-fast-easy-to-use-and-popular-graph-visualization-tool)
- [A Look At Graph Visualization With Sigma React — William Lyon](https://lyonwj.com/blog/sigma-react-graph-visualization)
- [React Sigma.js: The Practical Guide — MENUDO](https://www.menudo.com/react-sigma-js-the-practical-guide-to-interactive-graph-visualization-in-react/)
- [A Comparison of JavaScript Graph/Network Visualisation Libraries — Cylynx](https://www.cylynx.io/blog/a-comparison-of-javascript-graph-network-visualisation-libraries/)
- [React Graph Visualization Guide — Cambridge Intelligence](https://cambridge-intelligence.com/blog/react-graph-visualization-library/)
- [Neo4j Bloom product page](https://neo4j.com/product/bloom/)
- [About Neo4j Bloom](https://neo4j.com/docs/bloom-user-guide/current/about-bloom/)
- [Bloom features in detail](https://neo4j.com/docs/bloom-user-guide/current/bloom-tutorial/)
- [Neo4j: Detect, visualize and analyze — Linkurious](https://linkurious.com/neo4j/)
- [Visualizing Graphs With WebGL and KeyLines — Cambridge Intelligence](https://cambridge-intelligence.com/visualizing-graphs-webgl/)
- [Reagraph — high-performance network graph visualization for React](https://reagraph.dev/)
- [reaviz/reagraph — GitHub](https://github.com/reaviz/reagraph)
- [Reagraph Clustering docs](https://reagraph.dev/docs/advanced/Clustering)
- [Reagraph Selection docs](https://reagraph.dev/docs/advanced/Selection)
- [vasturiano/react-force-graph — GitHub](https://github.com/vasturiano/react-force-graph)
- [vasturiano/3d-force-graph — GitHub](https://github.com/vasturiano/3d-force-graph)
- [Graph visualization UX: Designing intuitive data experiences — Cambridge Intelligence](https://cambridge-intelligence.com/blog/designing-intuitive-data-experiences-with-graph-visualizations/)
- [15 best graph visualization tools for 2026 — Guideflow](https://www.guideflow.com/blog/graph-visualization-tools)
- Project's own design docs: `docs/01` (viability), `docs/03` (architecture), `docs/05` (React API), `docs/07` (roadmap), `docs/08` (licensing), `docs/adr/0001-0003`

**Confidence caveat:** All findings above came from `WebSearch` (classified `LOW` confidence per the project's source-hierarchy tooling — no verified/Context7 cross-check was performed this pass). Findings were treated as more reliable where (a) multiple independent search results agreed, and (b) they corroborated the project's own pre-existing `docs/01-08` design documents, which were themselves informed by direct inspection of the source repository. Treat competitor-specific numeric claims (e.g., "100k-500k nodes," "60fps at 10k elements") as directional, not benchmarked guarantees — re-verify with Context7 or primary docs before using them in performance commitments (Milestone 5).

---
*Feature research for: React/JS knowledge-graph visualization component library*
*Researched: 2026-07-08*
