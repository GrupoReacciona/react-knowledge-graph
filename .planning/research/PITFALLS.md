# Pitfalls Research

**Domain:** React/Three.js graph-visualization library extracted from an OSS monolith (MIT provenance)
**Researched:** 2026-07-08
**Confidence:** MEDIUM (R3F guidance is HIGH — sourced from official pmndrs docs via Context7; extraction and licensing guidance is MEDIUM/LOW — general web sources, not project-specific case studies)

## Critical Pitfalls

### Pitfall 1: Shipping the import with unresolved attribution ("template NOTICE" ships to a real commit)

**What goes wrong:**
The repo already has this exact landmine armed: `NOTICE.md:14` explicitly says "replace this notice with the exact upstream repository URL, copyright holder, and license text from the specific revision used" — and it hasn't been done. If Fase 1 ("Importación controlada" in `docs/06-extraction-plan.md`) happens before this is resolved, the derived code lands in git history under a placeholder attribution. Even if fixed later, the import commit itself is now a permanent, auditable record of non-compliance at the moment code was introduced.

**Why it happens:**
Attribution feels like paperwork that can be "finished later," while the code import feels like the real work. Teams sequence it backwards — code first, compliance as cleanup — because the plan documents (`docs/06`, `docs/08`) describe it in the right order, but nothing enforces the order in practice.

**How to avoid:**
Hard-gate Fase 1: `NOTICE.md` must reference the exact commit SHA of `codebase-memory-mcp` being imported (not "codebase-memory-mcp" generically), the real copyright holder string from that repo's LICENSE file, and the license text verbatim. Do not open Fase 1 until this file passes review. Keep the import as its own commit (per the extraction plan's own recommendation) so the attribution-plus-code pairing is atomic and auditable.

**Warning signs:**
`NOTICE.md` still contains the words "before publishing" or "replace this" at the time any import PR is opened. `THIRD_PARTY_NOTICES.md` doesn't exist yet when dependencies (`three`, `@react-three/fiber`) are first added to `package.json`.

**Phase to address:** Milestone 1 (Repo base y documentación) — must be closed out before Milestone 2's "Importar visor original" begins.

---

### Pitfall 2: "Decoupled" component that only moved the fetch call, not the coupling

**What goes wrong:**
The extraction plan's own before/after example (`docs/06-extraction-plan.md` Fase 2) shows replacing `fetchGraphFromApi()` with `<KnowledgeGraphViewer nodes edges />` — but this is the easy 10% of decoupling. The hard 90% is everything the original scene, camera rig, controls, and node/edge renderers implicitly assumed about the data: field names inherited from the MCP/SQLite schema, ID formats tied to AST node identifiers, group/kind enums that only make sense for code graphs, styling assumptions baked into component internals rather than exposed as props. A team can pass the "no `fetchGraphFromApi` call" checklist item while still being unable to render a Neo4j or Graphology graph without adapter-shaped workarounds — because the component's internals still think in `codebase-memory` terms.

**Why it happens:**
Removing the visible coupling point (an HTTP call, an import path) is a mechanical, verifiable task. Removing the invisible coupling — assumptions embedded in variable names, default values, and edge cases the original renderer was tuned for — requires actually understanding the general graph domain, which is slower and less checkbox-friendly.

**How to avoid:**
Before declaring Milestone 3 done, deliberately feed the component two structurally different graphs it was never designed around — e.g., a small hand-built Graphology export and a synthetic GraphRAG-shaped graph with different `kind`/`group` vocabularies than code graphs use — and confirm it renders both without adapter-side hacks. If it only works cleanly for code-graph-shaped data, `graph-core`'s "neutral" model isn't actually neutral yet.

**How to avoid (structural):** Enforce the `docs/03-architecture.md` layering as a lint/import-boundary rule (e.g., dependency-cruiser or ESLint `no-restricted-imports`) that fails CI if `react-knowledge-graph` or `graph-renderer-three` import anything from an `adapters/*` package — not just a manual code-review checklist item, since checklists get skipped under deadline pressure.

**Warning signs:** Adapter code (`fromCodebaseMemoryGraph`) is large and does more than field remapping — e.g., it's compensating for the core component expecting specific `metadata` keys. Prop names or types in `KnowledgeGraphViewer` reference MCP-specific concepts (AST node kinds, file paths) rather than generic ones.

**Phase to address:** Milestone 3 (Desacoplamiento real) — verification should happen before Milestone 6 (Adaptadores) begins, since a genuinely neutral core makes adapters thin; a fake-neutral core makes adapters do the real decoupling work that should have happened in Milestone 3.

---

### Pitfall 3: Architectural drift — an `apiUrl`-shaped prop creeps back in

**What goes wrong:**
The project has an explicit ADR (`docs/adr/0003-no-internal-fetching.md`) banning internal fetching inside `KnowledgeGraphViewer`. `CONCERNS.md` already flags this as the primary "fragile area" risk: nothing currently stops a future contributor (or a well-intentioned "convenience" feature request like "auto-refresh from a URL") from reintroducing an `apiUrl` or `fetchGraph` prop once the component exists and people want it to be more convenient to wire up.

**Why it happens:** Once the component works, the fastest way to satisfy "make it easier to use with our specific backend" is to let it fetch its own data — and no automated check tells the contributor they've violated the neutrality contract.

**How to avoid:** Turn ADR 0003 into an enforceable rule: a lint rule or a CI grep-check that fails if `react-knowledge-graph`'s source contains `fetch(`, `axios`, `useQuery`, or similar network primitives. Document in the component's contribution guide that any "fetch this for me" request belongs in an adapter or a consumer-side wrapper, never inside the core package.

**Warning signs:** A PR adds a prop with names like `apiUrl`, `endpoint`, `source`, or `dataUrl` to `KnowledgeGraphViewer`. A PR adds `fetch`/`axios`/data-fetching hooks as a dependency of `packages/react-knowledge-graph`.

**Phase to address:** Milestone 2/3 (introduce the guardrail as soon as the component exists) — ongoing enforcement through every later milestone.

---

### Pitfall 4: One mesh per node/edge — draw-call blowup that only shows up at scale

**What goes wrong:**
The natural, simplest R3F implementation renders each graph node as its own `<mesh>` and each edge as its own `<line>`. This looks correct and performs fine in Milestone 2/3 demos with a handful of mock nodes. It silently becomes the dominant bottleneck once Milestone 5's stated targets (1k–10k nodes) are attempted, because each mesh is a separate draw call, and typical guidance caps "no more than ~1000 draw calls as an absolute maximum, optimally a few hundred," well below the 10k-node target.

**Why it happens:** Naive per-object rendering is the obvious first implementation, ships fast, and the perf cliff (GPU draw-call overhead, not raw triangle count) is not visible until node counts are an order of magnitude higher than the demo data used during initial development.

**How to avoid:** Design the renderer around instancing (`InstancedMesh` for nodes, batched line-segment geometry or instanced edges) from Milestone 3/5, not as a retrofit. Reuse a small set of shared geometries/materials rather than creating one per node — Three.js/R3F's own guidance is explicit that unique geometries and materials each add GPU overhead that compounds at scale. Treat "does it still hold 60fps at 5k nodes" as a Milestone 5 acceptance gate, not an optional stretch goal.

**Warning signs:** The renderer's node/edge components are plain `<mesh>`/`<line>` elements mapped 1:1 over the `nodes`/`edges` arrays with no `InstancedMesh` or geometry-merging layer. Frame rate visibly drops well before reaching the stated 10k-node target during ad hoc testing.

**Phase to address:** Milestone 3 (renderer implementation, design decision) with hard verification in Milestone 5 (Rendimiento).

---

### Pitfall 5: Allocating objects inside `useFrame` (GC churn nobody notices until it's too late)

**What goes wrong:**
R3F's own pitfalls documentation calls this out directly: creating `new THREE.Vector3(...)` (or any Three.js object) inside a `useFrame` callback allocates memory every frame with no reliable garbage collection guarantee for Three.js/GPU-backed objects, leading to periodic GC pauses that show up as stutter — often intermittent and hard to reproduce, which makes it easy to ship and easy to misdiagnose later as "something else is slow."

**Why it happens:** It's the natural way to write the code the first time (`ref.current.position.lerp(new THREE.Vector3(x, y, z), 0.1)` reads perfectly fine and is correct-looking), and the cost is invisible in dev tools unless profiling GC activity specifically.

**How to avoid:** Establish the convention early (ideally as an ESLint rule — `@react-three/eslint-plugin`'s `no-new-in-loop` rule exists for exactly this) that any Three.js object used inside `useFrame` must be created once via `useMemo` or a module-level/ref-held instance and mutated in place (`vec.set(x, y, z)`), never instantiated per frame. Apply this to camera controls, node position interpolation, and any per-frame layout tick logic in the graph renderer.

**Warning signs:** Any `new THREE.*(...)` call appears textually inside a `useFrame` callback body. Stutter that correlates with node/edge count but doesn't show up in React DevTools profiling (because the cost is in GC, not React render).

**Phase to address:** Milestone 2/3 (establish the lint rule and convention when the renderer is first built) — cheap to fix now, expensive to hunt down after Milestone 5 perf work has already shipped.

---

### Pitfall 6: Force layout simulation blocking the main thread / render loop

**What goes wrong:**
Force-directed layout is computationally expensive — naive pairwise force computation is O(n²) per tick, and community reports place visible lag starting around 300–400 nodes with severe main-thread blocking beyond ~1000, well inside this project's stated 1k–10k node target range. If the physics tick runs synchronously inside the React render path or the R3F frame loop without care, both the graph interaction (drag, hover, click) and the rest of the page can stall during layout convergence, which is exactly the range Milestone 5 is meant to validate.

**Why it happens:** The simplest integration path calls the force-simulation library's `tick()` once per animation frame directly in `useFrame`, which is fine at small scale and becomes a hard wall as node count grows — and the wall is discovered late because Milestones 2–4 deliberately use small/mock graphs.

**How to avoid:** Treat layout computation as a separable concern from rendering from the start (`graph-core` or a dedicated layout module, not baked into the R3F renderer). Plan for a Web Worker–based simulation (or an approximation algorithm such as Barnes-Hut, O(n log n)) before Milestone 5's 5k/10k benchmarks, rather than discovering the need for it mid-benchmark. Precompute/cache layout for static graphs where live physics isn't needed (many knowledge-graph and code-graph use cases don't need continuous force simulation — a one-shot layout is often sufficient and much cheaper).

**Warning signs:** Dragging a node or panning the camera becomes unresponsive as graph size grows, even though FPS counters look acceptable in isolation. The layout algorithm choice was never explicitly discussed/documented — it's just "whatever the imported visor already did."

**Phase to address:** Milestone 5 (Rendimiento) is the explicit home for this, but the architectural decision (is layout computed off-thread, is it separable from `graph-renderer-three`) needs to be made no later than Milestone 3, since retrofitting worker-based computation into a tightly coupled renderer is much more expensive than designing for it upfront.

---

### Pitfall 7: `metadata` and custom render props become an unaudited XSS surface

**What goes wrong:**
`CONCERNS.md` already flags this precisely: the neutral graph schema defines `metadata` as an unconstrained object (`Record<string, unknown>`), and the React API design includes custom label/inspector render props. Because consumers can pass arbitrary graph data (including from untrusted upstream sources like scraped documents, third-party Neo4j instances, or user-editable knowledge bases), any code path that renders `metadata` values as HTML, or interpolates them into DOM attributes/tooltips without escaping, is an XSS vector — and `SECURITY.md`'s current stance ("consumers should sanitize") is a documentation-only mitigation with no enforcement.

**Why it happens:** A generic viewer needs to display arbitrary user-supplied content (labels, tooltips, inspector fields) to be useful across domains, and the most flexible-looking API is "just pass a render function" — which quietly shifts the sanitization burden onto every consumer, most of whom will forget.

**How to avoid:** Bake a default-safe rendering path into `graph-core`/`react-knowledge-graph` itself: default label/tooltip renderers should text-escape by default (never `dangerouslySetInnerHTML` unless a consumer explicitly opts into an "I will sanitize this myself" API surface). If custom render props are supported, document and test that they receive raw, unescaped data and that the library's default components never do unsafe interpolation.

**Warning signs:** Any `dangerouslySetInnerHTML` usage introduced in the inspector/tooltip/label code without an adjacent sanitizer call. `metadata` values flow into `title` attributes, `innerHTML`, or dynamically constructed CSS/style strings without escaping.

**Phase to address:** Milestone 3 (`graph-core` validation layer) for the schema/validation half; Milestone 4 (UX de exploración — inspector, tooltips) for the rendering half, since that's where user-facing metadata display is actually built.

---

### Pitfall 8: License policy exists on paper but nothing enforces it at dependency-add time

**What goes wrong:**
`docs/08-licensing-compliance.md` defines a clear allow/review/block license policy (MIT/BSD/ISC/Apache-2.0 allowed; MPL/LGPL/EPL manual review; GPL/AGPL/SSPL blocked), and `CONCERNS.md` already confirms no automated license-checker is wired into CI. The moment real dependencies land (`three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, plus whatever layout/graph libraries Milestone 5/6 pull in), a transitively-pulled GPL/AGPL package can enter the tree undetected, because `pnpm add` doesn't check license compatibility by default.

**Why it happens:** License policy is written as a document, not as a gate, and "we'll add the CI check later" is exactly the kind of deferred infrastructure work that gets skipped once feature work starts moving.

**How to avoid:** Wire `pnpm licenses list` (or `license-checker-rseidelsohn`) into CI as part of Milestone 1's scaffolding — before the first real dependency (`three`) is added, not after. Fail the build on any disallowed or "needs review" license appearing in the dependency tree, including transitive dependencies. Document a "review process" (who approves MPL/LGPL/EPL exceptions) so the check isn't a dead-end blocker.

**Warning signs:** `package.json:6-9`'s `docs:check`/`licenses:check` scripts still `echo` placeholder messages instead of running real tooling (already true as of this research). Any PR adds a dependency without a corresponding CI license-check run showing green.

**Phase to address:** Milestone 1 (Repo base) — this is explicitly called out in the project's own `docs/06-extraction-plan.md` Fase 0 and flagged as unresolved tech debt in `CONCERNS.md`.

---

### Pitfall 9: Duplicate React/Three instances from monorepo peer-dependency misconfiguration

**What goes wrong:**
In a pnpm workspace (the tooling the extraction plan recommends), pnpm's strict `node_modules` isolation means a package that doesn't explicitly declare `react`, `react-dom`, `three`, and `@react-three/fiber` as `peerDependencies` (not regular `dependencies`) can end up resolving its own separate copy of these libraries instead of sharing the host app's instance. For React this manifests as the classic "Invalid hook call" runtime error; for Three.js/R3F it manifests as subtler bugs (multiple `THREE.Scene`/renderer contexts, broken `instanceof` checks between packages, or R3F's reconciler failing to recognize the same class instances across package boundaries) that are much harder to diagnose than a hook-call error.

**Why it happens:** It's easy to add `react` and `three` as regular `dependencies` while developing a package in isolation (it "just works" locally), and the peer-dependency requirement only becomes visible once the package is consumed alongside a host app with its own copies of the same libraries — exactly the situation `packages/react-knowledge-graph` will be in once `examples/*` or an internal consumer app wires it up.

**How to avoid:** Declare `react`, `react-dom`, `three`, `@react-three/fiber`, and `@react-three/drei` as `peerDependencies` (with `devDependencies` for local development) in every package under `packages/*` that touches them — never as plain `dependencies`. Use a pnpm-workspace `catalog` entry to pin one shared version across all workspace packages and examples, preventing accidental version drift that reintroduces the same class of bug even with peer deps declared correctly.

**Warning signs:** `react` or `three` appear under `dependencies` (not `peerDependencies`) in any package under `packages/`. An example app throws "Invalid hook call" or renders a blank Three.js canvas with no console error once the library is installed as a workspace dependency rather than developed in-place.

**Phase to address:** Milestone 1 (monorepo scaffolding, when `pnpm-workspace.yaml` and initial `package.json` files for each package are created) — must be correct before Milestone 2's component work begins, since fixing it later means touching every package's manifest.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| One `<mesh>` per node/edge instead of instancing | Ships Milestone 2/3 demo fast, simplest code to review | Full re-architecture of the renderer needed once Milestone 5 hits 1k+ nodes | Only for Milestone 2's mock-data demo; must be replaced before Milestone 5 benchmarks |
| Leaving `metadata: Record<string, unknown>` fully unconstrained | Maximizes flexibility across code graphs, GraphRAG, Neo4j, legal/document graphs | Every consumer becomes responsible for their own sanitization; XSS surface grows with every new adapter | Acceptable long-term only if paired with default-safe (escaped) rendering in the core components — never acceptable if custom renderers get "convenience" `dangerouslySetInnerHTML` shortcuts |
| Synchronous force-layout tick in `useFrame` | Simple integration, matches most tutorial code | Blocks main thread and interaction at the exact node counts (1k-10k) this project targets | Only for graphs under a few hundred nodes / Milestone 2-4 demos; must move off-thread before Milestone 5 |
| Skipping the CI license-check "for now" | Faster Milestone 1 setup, no tooling friction | A GPL/AGPL dependency can land silently and require a retroactive dependency audit/removal, which is far more expensive than a blocked `pnpm add` | Never acceptable — this is explicitly a pre-Milestone-2 gate per the project's own `docs/06` plan |
| Treating the import commit as "just get the files in, clean up licensing after" | Faster start on Milestone 2 | Permanent non-compliant commit in git history; may require history rewrite or a public correction if the repo goes public later | Never acceptable given the stated intent to eventually open-source under `@gruporeacciona` |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Codebase Memory MCP adapter (Milestone 6) | Adapter reaches back into MCP-specific concepts (AST node kinds, file paths) that leak into `graph-core` types, recreating the coupling Milestone 3 was meant to remove | Adapter should only translate field shapes at the boundary; `GraphNode`/`GraphEdge` in `graph-core` must stay ignorant of where the data came from |
| Graphology adapter | Assuming Graphology's node/edge attribute conventions map 1:1 onto this project's `metadata` shape without validation | Run the neutral-model validator (unique IDs, edges reference existing nodes, no orphans) on adapter output just like any other source — don't special-case "trusted" adapters |
| Neo4j adapter | Treating Neo4j's driver-returned `Record` objects as already-serializable — Neo4j integers/temporal types don't JSON-serialize cleanly and can silently corrupt IDs or crash normalization | Explicitly convert Neo4j-native types (Integer, Node, Relationship) to plain JS values before handing data to `graph-core`'s normalizer |
| `@react-three/postprocessing` (bloom/particles, mentioned in `docs/05-react-api.md`) | Enabling `enableBloom`/`enableParticles` by default without a scale gate — post-processing passes are typically the first thing to blow the frame budget at 5k+ nodes | Gate expensive post-processing behind explicit opt-in props and/or an automatic node-count threshold that disables them past a configurable size |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Per-node/edge mesh instead of instancing | Smooth at demo scale, frame rate collapses as node count rises | `InstancedMesh` for nodes, batched/instanced geometry for edges | Somewhere between a few hundred and ~1000 nodes, well below the 10k target |
| New Three.js object allocation inside `useFrame` | Intermittent stutter that doesn't correlate cleanly with any single obvious cause; worse under GC pressure | `useMemo`/module-level reusable objects, mutate via `.set()`/`.copy()` | Gets worse as animation complexity or node count grows; can appear even at moderate scale |
| Default `frameloop="always"` re-rendering an idle scene | Battery/CPU usage stays high even when nothing is happening (static graph, no interaction) | `frameloop="demand"` with explicit `invalidate()` calls on data/camera change | Always present, but only matters once users complain about idle CPU/battery cost |
| Naive O(n²) force-directed layout on main thread | Layout "freezes" the UI during convergence; dragging/panning becomes laggy as node count grows | Web Worker–hosted simulation or Barnes-Hut approximation; consider precomputed/static layouts for non-interactive-physics use cases | Visible lag from ~300-400 nodes, severe blocking beyond ~1000 — squarely inside the 1k-10k target range |
| Unbounded label rendering (every node gets a persistent text label) | Text/sprite overdraw dominates frame time long before geometry does | Label-density strategy (hover/selection-only labels, per `docs/07-roadmap.md` Milestone 5) rather than always-on labels | Becomes the dominant cost well before geometry does, often in the low thousands of nodes |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering `metadata`/label values via `dangerouslySetInnerHTML` without sanitization | XSS if graph data originates from untrusted sources (scraped docs, user-editable KGs, third-party Neo4j instances) | Default components escape by default; any HTML-rendering opt-in requires explicit consumer acknowledgment and documentation of the sanitization contract |
| Trusting adapter output as "internal, therefore safe" | Adapters (Milestone 6) sit between untrusted external data (Neo4j records, scraped GraphRAG output) and the render layer; skipping validation there reintroduces the same risk `graph-core` was meant to close | Run the same `graph-core` validators on all adapter output, with no "trusted source" bypass |
| Publishing under `@gruporeacciona` npm scope or making the repo public before internal approval | Violates the organization's explicit publication-approval policy (per `PROJECT.md` Constraints); could expose confidential extraction/attribution decisions before they're finalized | Gate any `npm publish` or repo visibility change behind an explicit internal approval step; treat Milestone 7 "Publicación interna" as internal-registry-only until that approval exists |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Force-directed layout that never stabilizes for large/dense graphs | Users watch nodes jitter indefinitely, can't focus on structure | Provide a "freeze/stop simulation" control and/or auto-stop once movement drops below a threshold; consider deterministic layouts as an alternative mode |
| Always-on labels for every node at high node counts | Visual clutter makes the graph unreadable exactly when it has the most information to convey | Hover/selection-based label reveal (already planned for Milestone 5) as the default, not an opt-in |
| No visual feedback while a large graph's layout/adapter transform is computing | Users think the app is frozen when it's actually working (especially relevant once Web Worker layout is added and results arrive asynchronously) | Explicit loading/computing state exposed via props/events, not just "nothing renders until it's ready" |

## "Looks Done But Isn't" Checklist

- [ ] **NOTICE.md finalized:** Often still contains placeholder language ("replace this notice...") — verify it names the exact upstream commit SHA, real copyright holder, and full license text before any import PR merges.
- [ ] **"No internal fetching" guarantee:** Often verified once by manual review at Milestone 2 and never re-checked — verify a CI grep/lint rule actually blocks `fetch`/`axios`/data-fetching hooks in `packages/react-knowledge-graph` on every PR, not just at initial review.
- [ ] **"Neutral" data model:** Often only tested against code-graph-shaped mock data — verify it renders correctly against at least one structurally different domain (e.g., a document/legal graph or GraphRAG-shaped graph) before declaring Milestone 3 complete.
- [ ] **Instancing/perf architecture:** Often looks fine because Milestones 2-4 only use small mock graphs — verify actual frame rate at 1k, 5k, and 10k nodes (per Milestone 5) rather than assuming the Milestone 2 implementation scales.
- [ ] **License compliance CI:** Often exists as documentation (`docs/08`) without a corresponding real check — verify `pnpm licenses list`/`license-checker-rseidelsohn` actually runs and fails the build on a disallowed license, not just that the policy is written down.
- [ ] **Peer dependencies:** Often correct in the package being actively developed but wrong once consumed from a separate app/example — verify by installing the package into `examples/*` as a real workspace dependency (not just running it in-place) and confirming no duplicate React/Three instances.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Placeholder NOTICE.md shipped in the import commit | MEDIUM | Finalize `NOTICE.md`/`THIRD_PARTY_NOTICES.md` with real details, commit as a follow-up; if the repo has already gone public, treat as urgent and consider a corrective release note — cheaper the earlier it's caught, before any public/npm publish |
| Shallow decoupling discovered late (adapters doing too much compensating work) | HIGH | Requires revisiting `graph-core`'s type definitions and the renderer's assumptions — effectively redoing part of Milestone 3; budget this as a real risk before committing to Milestone 6 adapter work on top of a shaky foundation |
| Draw-call/instancing architecture retrofit | HIGH | Re-architecting node/edge rendering from per-object meshes to instanced meshes touches most of `graph-renderer-three` — cheaper to design correctly from Milestone 3 than to retrofit after Milestone 5 benchmarking reveals the problem |
| GPL/AGPL dependency discovered already merged | MEDIUM-HIGH | Identify all consumers of the offending package, find an MIT/BSD/Apache alternative or vendor a minimal reimplementation, remove and re-audit the full dependency tree — cost scales with how deep the dependency was integrated before discovery |
| Duplicate React/Three instances from missing peerDependencies | LOW-MEDIUM | Move `react`/`three`/`@react-three/fiber` from `dependencies` to `peerDependencies` in the offending package(s), add a workspace catalog entry, reinstall — fast fix once diagnosed, but diagnosis itself can be time-consuming without knowing this failure mode |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Placeholder NOTICE.md / unresolved attribution | Milestone 1 | `NOTICE.md` names exact upstream commit SHA + real copyright holder before Milestone 2's import step begins |
| Shallow decoupling (top-level component only) | Milestone 3 | Component renders a structurally different (non-code-graph) mock dataset without adapter workarounds |
| `apiUrl`-style architectural drift | Milestone 2/3 (guardrail introduced), enforced every phase after | CI lint/grep blocks `fetch`/`axios`/data-hooks in the core package |
| Draw-call blowup (no instancing) | Milestone 3 (design), Milestone 5 (verified) | Frame rate benchmark at 1k/5k/10k nodes meets target before Milestone 5 sign-off |
| `useFrame` object allocation | Milestone 2/3 | ESLint rule (`no-new-in-loop` equivalent) passes in CI |
| Main-thread-blocking force layout | Milestone 3 (architecture decision), Milestone 5 (verified) | UI remains interactive (drag/pan) during layout convergence at 5k/10k nodes |
| Unsanitized `metadata`/label rendering (XSS) | Milestone 3 (validation layer), Milestone 4 (inspector/tooltip UI) | No `dangerouslySetInnerHTML` without adjacent sanitizer; default renderers escape by default |
| No CI license enforcement | Milestone 1 | `pnpm licenses list` (or equivalent) runs in CI and fails on disallowed licenses before first real dependency (`three`) is merged |
| Duplicate React/Three instances (peer deps) | Milestone 1 (scaffolding) | Library installs cleanly into `examples/*` as a workspace dependency with no duplicate-instance errors |
| Publishing without internal approval | Milestone 7 (Publicación) | Explicit internal approval recorded before any npm publish beyond a private/internal registry, or any repo visibility change to public |

## Sources

- [Scaling performance — React Three Fiber](https://r3f.docs.pmnd.rs/advanced/scaling-performance) — official docs, HIGH confidence
- pmndrs/react-three-fiber `docs/advanced/pitfalls.mdx` and `no-new-in-loop` ESLint rule docs, fetched via Context7 (`/pmndrs/react-three-fiber`) — official repo source, MEDIUM-HIGH confidence
- [r3f-forcegraph (vasturiano)](https://github.com/vasturiano/r3f-forcegraph) — reference implementation for force-directed graphs in R3F
- [React Three Fiber Discussion #697 — Canvas render loop performance](https://github.com/pmndrs/react-three-fiber/discussions/697)
- [React-Three-Fiber: Enhancing Scene Quality with Drei + Performance Tips](https://medium.com/@ertugrulyaman99/react-three-fiber-enhancing-scene-quality-with-drei-performance-tips-976ba3fba67a) — LOW confidence, community source
- [The Best Libraries and Methods to Render Large Force-Directed Graphs on the Web](https://weber-stephen.medium.com/the-best-libraries-and-methods-to-render-large-network-graphs-on-the-web-d122ece2f4dc) — LOW confidence, community source, corroborates O(n²)/Barnes-Hut and main-thread-blocking claims
- [How To Create a Component Library From a Monolith — A Case Study](https://medium.com/flatwave-insights/how-to-create-a-component-library-from-a-monolith-a-case-study-4a8b3f01e590) — LOW confidence, single case study, used for extraction anti-pattern framing
- [Extracting Services from a Monolithic App](https://newsletter.systemdesigncodex.com/p/extracting-services-from-a-monolithic) — LOW confidence
- [Refactoring a monolith to microservices — microservices.io](https://microservices.io/refactoring/) — general pattern reference (strangler-fig framing), MEDIUM confidence (established reference site)
- [Open Source Software Licenses 101: The MIT License — FOSSA Blog](https://fossa.com/blog/open-source-licenses-101-mit-license/) — MEDIUM confidence, vendor blog specializing in license compliance
- [The MIT License — Open Source Initiative](https://opensource.org/license/mit) — canonical license text source, HIGH confidence
- [pnpm Workspaces documentation](https://pnpm.io/workspaces) — official docs, HIGH confidence
- [Missing peerDependencies causes duplicate React instances — callstack/react-native-slider#769](https://github.com/callstack/react-native-slider/issues/769) — concrete real-world instance of the pitfall, MEDIUM confidence
- Project documents used as primary domain context (not external sources, but load-bearing for phase mapping): `.planning/PROJECT.md`, `docs/06-extraction-plan.md`, `docs/07-roadmap.md`, `docs/08-licensing-compliance.md`, `.planning/codebase/CONCERNS.md`, `NOTICE.md`, `docs/adr/0003-no-internal-fetching.md`

---
*Pitfalls research for: React knowledge-graph visualization library (R3F-based, extracted from codebase-memory-mcp under MIT)*
*Researched: 2026-07-08*
