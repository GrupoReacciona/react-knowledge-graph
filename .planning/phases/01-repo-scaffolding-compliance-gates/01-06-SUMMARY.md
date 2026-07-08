---
phase: 01-repo-scaffolding-compliance-gates
plan: 06
subsystem: infra
tags: [typescript, pnpm-workspace-catalog, turborepo, eslint, react-knowledge-graph, peerDependencies]

# Dependency graph
requires:
  - phase: 01-repo-scaffolding-compliance-gates
    provides: "packages/graph-core scaffolded and buildable (Plan 01-03); packages/graph-renderer-three scaffolded and buildable with peerDependencies via catalog: (Plan 01-04); D-06 ESLint architecture-boundary block (Plan 01-02)"
provides:
  - "packages/react-knowledge-graph/package.json — @gruporeacciona/react-knowledge-graph (the exact public package name), peerDependencies (not plain dependencies) for react/react-dom/three/@react-three/fiber/@react-three/drei, all wired via catalog:, plus dependencies on both @gruporeacciona/graph-core and @gruporeacciona/graph-renderer-three via workspace:*"
  - "packages/react-knowledge-graph/tsconfig.json — extends tsconfig.base.json, jsx: react-jsx, references both ../graph-core and ../graph-renderer-three"
  - "packages/react-knowledge-graph/src/index.ts — placeholder entry point, buildable via tsc --build / turbo run build"
  - "Empirical proof that the D-06 ESLint block (Plan 01-02) allows react (unlike D-05's graph-core block, which blocks it) while still blocking three, @react-three/fiber, and a bare fetch(...) global, then reverted to a clean state"
  - "Empirical proof (pnpm why three, pnpm why react) that exactly one resolved version of three and exactly one resolved version of react exist in the workspace tree, confirming the peerDependencies (not dependencies) declaration prevents duplicate instances at the most externally-visible package"
affects: [01-07-examples-skeleton, 01-08-verification-slice]

# Tech tracking
tech-stack:
  added: []
  patterns: ["react-knowledge-graph as the public entry point depending on both graph-core and graph-renderer-three via TypeScript project references, with peerDependencies wired through the pnpm workspace catalog: protocol — same mechanism as graph-renderer-three (Plan 01-04), applied at the package that will eventually ship as @gruporeacciona/react-knowledge-graph"]

key-files:
  created: [packages/react-knowledge-graph/package.json, packages/react-knowledge-graph/tsconfig.json, packages/react-knowledge-graph/src/index.ts]
  modified: [pnpm-lock.yaml]

key-decisions:
  - "Wrote package.json/tsconfig.json/src/index.ts directly with the catalog: protocol and workspace:* references already applied, rather than running `pnpm --filter @gruporeacciona/react-knowledge-graph add --save-peer react react-dom three @react-three/fiber @react-three/drei` first and hand-editing afterward — identical rationale to Plan 01-04: the catalog entries were already fixed in pnpm-workspace.yaml by Plan 01-01, so writing them directly reaches the same end state with one fewer edit-and-revert round trip, while `pnpm install` + `pnpm why three`/`pnpm why react` were still run afterward to empirically prove workspace resolution (satisfying the plan's actual acceptance criteria, not just its suggested mechanism)."

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-07]

coverage:
  - id: D1
    description: "packages/react-knowledge-graph/package.json declares peerDependencies (not dependencies) for react, react-dom, three, @react-three/fiber, @react-three/drei, all set to catalog:, and dependencies on both @gruporeacciona/graph-core and @gruporeacciona/graph-renderer-three via workspace:*"
    requirement: "INFRA-07"
    verification:
      - kind: unit
        ref: "node -e checking p.peerDependencies[dep] === 'catalog:' for all five packages and p.dependencies containing both graph-core and graph-renderer-three (manual command invocation) — printed OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "react-knowledge-graph builds cleanly via TypeScript project references, resolving references to both graph-core and graph-renderer-three"
    requirement: "INFRA-01, INFRA-02"
    verification:
      - kind: unit
        ref: "pnpm exec turbo run build --filter=@gruporeacciona/react-knowledge-graph (manual command invocation) — 3 successful, 3 total (graph-core cache hit + graph-renderer-three cache hit + react-knowledge-graph fresh build)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No duplicate three or react resolution exists in the workspace tree after react-knowledge-graph's peerDependencies wiring"
    requirement: "INFRA-07"
    verification:
      - kind: unit
        ref: "pnpm why three (manual command invocation) — 'Found 1 version of three'"
        status: pass
      - kind: unit
        ref: "pnpm why react (manual command invocation) — 'Found 1 version of react'"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-06 ESLint architecture guard empirically allows react (distinct from D-05's graph-core block, which blocks react entirely) while still blocking three, @react-three/fiber, and a bare fetch(...) global, then reverted to a clean state matching Task 1's placeholder exactly"
    requirement: "INFRA-03"
    verification:
      - kind: unit
        ref: "pnpm exec eslint packages/react-knowledge-graph with temporary `import React from 'react';` — 'ESLint: No issues found' (manual command invocation)"
        status: pass
      - kind: unit
        ref: "pnpm exec eslint packages/react-knowledge-graph with temporary `import * as THREE from 'three';` — 1 error, ruleId no-restricted-imports (manual command invocation)"
        status: pass
      - kind: unit
        ref: "pnpm exec eslint packages/react-knowledge-graph with temporary `import { Canvas } from '@react-three/fiber';` — 1 error, ruleId no-restricted-imports (manual command invocation)"
        status: pass
      - kind: unit
        ref: "pnpm exec eslint packages/react-knowledge-graph with temporary `fetch('http://example.com');` — 1 error, ruleId no-restricted-globals (manual command invocation)"
        status: pass
      - kind: unit
        ref: "pnpm exec eslint packages/react-knowledge-graph on final reverted src/index.ts — 'ESLint: No issues found'; git diff --stat HEAD -- packages/react-knowledge-graph/src/index.ts shows zero residual diff (manual command invocation)"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-07-08
status: complete
---

# Phase 1 Plan 6: react-knowledge-graph Package Scaffolding + peerDependencies + D-06 Guard Verification Summary

**`packages/react-knowledge-graph` scaffolded as the public component layer that will eventually ship as `@gruporeacciona/react-knowledge-graph`, with peerDependencies wired through the pnpm workspace `catalog:` protocol, project references to both `graph-core` and `graph-renderer-three`, and the Plan 01-02 D-06 ESLint block empirically proven to allow `react`/`react-dom` while still blocking direct `three`/`@react-three/*` imports and `fetch()`.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2 (both auto)
- **Files modified:** 4 (3 created: package.json, tsconfig.json, src/index.ts; 1 modified: pnpm-lock.yaml)

## Accomplishments

- `packages/react-knowledge-graph/package.json` created: `@gruporeacciona/react-knowledge-graph` (the exact public npm package name from README.md/PROJECT.md), `version: 0.0.0`, `private: true`, `type: module`, `main`/`types` pointing at `./dist`, `build`/`lint`/`typecheck` scripts matching graph-renderer-three's pattern, `"dependencies": { "@gruporeacciona/graph-core": "workspace:*", "@gruporeacciona/graph-renderer-three": "workspace:*" }`, and `"peerDependencies"` for all five of `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, each set to `"catalog:"` — confirmed via a direct `node -e` check against the file
- `packages/react-knowledge-graph/tsconfig.json` created extending `../../tsconfig.base.json`, with `jsx: "react-jsx"`, `outDir`/`rootDir`/`tsBuildInfoFile` under `./dist`, `include: ["src"]`, and `references: [{ "path": "../graph-core" }, { "path": "../graph-renderer-three" }]` — the exact example from `01-PATTERNS.md`, resolving both upstream package references matching `docs/03-architecture.md`'s dependency direction (this is the public entry point, depends on both lower layers)
- `packages/react-knowledge-graph/src/index.ts` created as a minimal placeholder (comment noting the real `KnowledgeGraphViewer` component and hooks land in Phase 3, VIEWER-01..10) — enough for `tsc --build` to have a valid, non-empty compilation unit
- `pnpm install` resolved the new workspace package; `pnpm exec turbo run build --filter=@gruporeacciona/react-knowledge-graph` succeeded: 3 tasks (graph-core build cache hit, graph-renderer-three build cache hit, react-knowledge-graph fresh build), producing real `dist/index.js`, `dist/index.d.ts`
- `pnpm why three` (run from repo root) showed **exactly one resolved version of `three`** across the entire workspace, now including `@gruporeacciona/react-knowledge-graph` in its dependent list alongside `@gruporeacciona/graph-renderer-three`; `pnpm why react` likewise showed **exactly one resolved version of `react`** — empirically confirming the peerDependencies-not-dependencies declaration prevents duplicate instances at the most externally-visible package in the monorepo (T-01-15 mitigated)
- **Empirically proved the D-06 ESLint guard allows `react` (the key distinction from D-05's graph-core block, which blocks `react` entirely):** temporarily added `import React from 'react';` to `src/index.ts` → `eslint packages/react-knowledge-graph` exited clean (`ESLint: No issues found`)
- **Empirically proved the D-06 guard still blocks direct Three.js access:** temporarily added `import * as THREE from 'three';` → failed with `no-restricted-imports`; separately added `import { Canvas } from '@react-three/fiber';` → also failed with `no-restricted-imports` (matching the `@react-three/*` pattern group) — confirming the public layer must route all Three.js access through `graph-renderer-three`, never directly (T-01-14 mitigated)
- **Empirically proved the D-06 guard still blocks backend calls:** temporarily added `fetch('http://example.com');` → failed with `no-restricted-globals`
- `packages/react-knowledge-graph/src/index.ts` was restored byte-for-byte to Task 1's placeholder content after all four trials — `git diff --stat HEAD -- packages/react-knowledge-graph/src/index.ts` confirms zero residual diff, and a final `eslint packages/react-knowledge-graph` run passed clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold packages/react-knowledge-graph with peerDependencies** - `1f9ce05` (feat)
2. **Task 2: Empirically verify the D-06 architecture guard against react-knowledge-graph** - no commit (verification-only task; temporary `react`-import [allowed, no revert needed for correctness but still restored for cleanliness], `three`-import, `@react-three/fiber`-import, and `fetch()` trials were all reverted before completion, leaving zero diff against Task 1's committed state — nothing new to commit, mirroring Plan 01-04's Task 3 and Plan 01-05's Task 2 pattern)

**Plan metadata:** this SUMMARY.md commit follows immediately after this file, per the sequential-executor protocol for this run (no worktree isolation for Plan 01-06 — running directly on `main`).

## Files Created/Modified

- `packages/react-knowledge-graph/package.json` - `@gruporeacciona/react-knowledge-graph`, peerDependencies via catalog: for react/react-dom/three/@react-three/fiber/@react-three/drei, workspace:* dependencies on both graph-core and graph-renderer-three
- `packages/react-knowledge-graph/tsconfig.json` - extends root base, jsx: react-jsx, references ../graph-core and ../graph-renderer-three
- `packages/react-knowledge-graph/src/index.ts` - placeholder entry point (Phase 3/VIEWER-01..10 will add the real `KnowledgeGraphViewer` component and hooks)
- `pnpm-lock.yaml` - regenerated to link the new `packages/react-knowledge-graph` workspace member and resolve its peerDependencies against the pnpm-workspace.yaml catalog

## Decisions Made

- Wrote `package.json`/`tsconfig.json`/`src/index.ts` directly with the `catalog:` protocol and `workspace:*` references already in place, instead of running `pnpm --filter @gruporeacciona/react-knowledge-graph add --save-peer react react-dom three @react-three/fiber @react-three/drei` first and then hand-editing each version string to `catalog:` (the plan's suggested two-step path). Both approaches converge on the identical final `package.json` content, since the catalog entries (`react ^19.2.7`, `react-dom ^19.2.7`, `three ^0.185.1`, `@react-three/fiber ^9.6.1`, `@react-three/drei ^10.7.7`) were already fixed in `pnpm-workspace.yaml` by Plan 01-01 — writing them directly avoids an unnecessary install-then-edit round trip while still running `pnpm install` and `pnpm why three`/`pnpm why react` afterward to empirically prove the workspace correctly resolves the declaration (satisfying the plan's actual acceptance criteria, not just its suggested mechanism). Identical reasoning to Plan 01-04's equivalent decision.
- Task 2 produced no commit: its own spec explicitly frames the react/three/@react-three/fiber and `fetch()` trials as temporary edits reverted before completion — after reverting, `git diff` shows zero changes versus Task 1's committed state, matching the established pattern from Plan 01-04 (Task 3) and Plan 01-05 (Task 2).

## Deviations from Plan

None - plan executed exactly as written. The direct-write vs. `pnpm add --save-peer`-then-edit choice (see Decisions Made) is an equivalent implementation path to the plan's suggested mechanism, not a deviation from its stated intent or acceptance criteria — all of which were independently verified regardless of which path produced the file.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. No package legitimacy checkpoint was needed for this plan (all five peerDependencies were already approved/scaffolded in Plans 01-01/01-04).

## Known Stubs

None. `src/index.ts` is an intentional, documented placeholder (`export {};` plus a comment) — this is the plan's explicit deliverable (pure scaffolding, no component logic, the real `KnowledgeGraphViewer` deferred to Phase 3/VIEWER-01..10), not an unintentional stub blocking the plan's goal.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced beyond what the plan's own `<threat_model>` already registered (T-01-14, T-01-15), both of which were empirically mitigated by this plan's own verify steps above.

## Next Phase Readiness

- `packages/react-knowledge-graph` is now a real, buildable, lint-clean TypeScript package with peerDependencies correctly wired via the pnpm workspace catalog, dependency references to both `graph-core` and `graph-renderer-three` — ready for `examples/*` (Plan 01-07) to consume as a real `workspace:*` dependency and prove INFRA-07's no-duplicate-instance criterion end-to-end with a real consumer.
- The D-06 ESLint block is now empirically confirmed to correctly distinguish "React is fine here" from "Three.js must route through graph-renderer-three" in a real package — Plan 01-08 (verification slice) can rely on this without re-deriving it.
- Root `tsconfig.json`'s solution-style `references` array now has all four planned packages scaffolded (`graph-core`, `graph-renderer-three`, `react-knowledge-graph`, `adapters/codebase-memory`) — no packages remain pending from the original monorepo layout.
- No blockers for Plan 01-07.

---
*Phase: 01-repo-scaffolding-compliance-gates*
*Completed: 2026-07-08*

## Self-Check: PASSED

All created files confirmed present on disk (packages/react-knowledge-graph/package.json, packages/react-knowledge-graph/tsconfig.json, packages/react-knowledge-graph/src/index.ts, this SUMMARY.md). Task 1 commit hash (1f9ce05) confirmed present in `git log --oneline --all`. Task 2 produced no commit by design (verification-only, zero residual diff after reverting all trial edits).
