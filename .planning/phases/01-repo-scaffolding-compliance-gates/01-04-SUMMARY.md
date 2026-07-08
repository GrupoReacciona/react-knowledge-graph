---
phase: 01-repo-scaffolding-compliance-gates
plan: 04
subsystem: infra
tags: [typescript, pnpm-workspace-catalog, turborepo, eslint, graph-renderer-three, peerDependencies]

# Dependency graph
requires:
  - phase: 01-repo-scaffolding-compliance-gates
    provides: "packages/graph-core scaffolded and buildable (Plan 01-03); pnpm workspace catalog: entries for react/react-dom/three/@react-three/fiber/@react-three/drei (Plan 01-01); D-07 ESLint architecture-boundary block (Plan 01-02)"
provides:
  - "packages/graph-renderer-three/package.json — @gruporeacciona/graph-renderer-three, peerDependencies (not plain dependencies) for react/react-dom/three/@react-three/fiber/@react-three/drei, all wired via catalog:"
  - "packages/graph-renderer-three/tsconfig.json — extends tsconfig.base.json, jsx: react-jsx, references ../graph-core only"
  - "packages/graph-renderer-three/src/index.ts — placeholder entry point, buildable via tsc --build / turbo run build"
  - "Empirical proof that the D-07 ESLint block (Plan 01-02) allows react/three/@react-three/fiber and blocks a bare fetch(...) global, then reverted to a clean state"
  - "Empirical proof (pnpm why three) that exactly one resolved version of three exists in the workspace tree, confirming the peerDependencies (not dependencies) declaration prevents duplicate instances"
affects: [01-05-react-knowledge-graph, 01-07-examples-skeleton, 01-08-verification-slice]

# Tech tracking
tech-stack:
  added: []
  patterns: ["graph-renderer-three as the sole gateway package (besides react-knowledge-graph) permitted to depend on Three.js/R3F, with peerDependencies wired through the pnpm workspace catalog: protocol to prevent version drift/duplicate instances"]

key-files:
  created: [packages/graph-renderer-three/package.json, packages/graph-renderer-three/tsconfig.json, packages/graph-renderer-three/src/index.ts]
  modified: [pnpm-lock.yaml]

key-decisions:
  - "Package legitimacy checkpoint for three@0.185.1 (flagged [SUS]/too-new in 01-RESEARCH.md, published 2026-07-01) was explicitly approved by the human operator before Task 2's install step proceeded — no fallback version substitution was needed."
  - "Wrote package.json/tsconfig.json/src/index.ts directly with the catalog: protocol already applied, rather than running `pnpm add --save-peer` first and hand-editing afterward — the exact catalog values (react ^19.2.7, react-dom ^19.2.7, three ^0.185.1, @react-three/fiber ^9.6.1, @react-three/drei ^10.7.7) were already defined in pnpm-workspace.yaml by Plan 01-01, so this reaches the identical end state with one fewer edit-and-revert round trip; `pnpm install` + `pnpm why three` was still run to empirically prove workspace resolution linked correctly (per the plan's acceptance criteria), not skipped."

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-07]

coverage:
  - id: D1
    description: "packages/graph-renderer-three/package.json declares peerDependencies (not dependencies) for react, react-dom, three, @react-three/fiber, @react-three/drei, all set to catalog:"
    requirement: "INFRA-07"
    verification:
      - kind: unit
        ref: "node -e checking p.peerDependencies[dep] === 'catalog:' for all five packages (manual command invocation)"
        status: pass
    human_judgment: false
  - id: D2
    description: "graph-renderer-three builds cleanly via TypeScript project references, resolving its reference to graph-core only"
    requirement: "INFRA-01, INFRA-02"
    verification:
      - kind: unit
        ref: "pnpm exec turbo run build --filter=@gruporeacciona/graph-renderer-three (manual command invocation) — 2 successful, 2 total (graph-core cache hit + graph-renderer-three build)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No duplicate three resolution exists in the workspace tree after peerDependencies wiring"
    requirement: "INFRA-07"
    verification:
      - kind: unit
        ref: "pnpm why three (manual command invocation) — 'Found 1 version of three'"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-07 ESLint architecture guard empirically allows react/three/@react-three/fiber imports and blocks a bare fetch(...) global, then reverted to a clean state matching Task 2's placeholder exactly"
    requirement: "INFRA-03"
    verification:
      - kind: unit
        ref: "pnpm exec eslint packages/graph-renderer-three with temporary `import * as React from 'react'; import * as THREE from 'three'; import { Canvas } from '@react-three/fiber';` — 'ESLint: No issues found' (manual command invocation)"
        status: pass
      - kind: unit
        ref: "pnpm exec eslint packages/graph-renderer-three with temporary `fetch('http://example.com');` — 1 error, ruleId no-restricted-globals (manual command invocation)"
        status: pass
      - kind: unit
        ref: "pnpm exec eslint packages/graph-renderer-three on final reverted src/index.ts — 'ESLint: No issues found'; git diff --stat HEAD -- packages/graph-renderer-three/src/index.ts shows zero residual diff (manual command invocation)"
        status: pass
    human_judgment: false

duration: ~15min (across two executor sessions, separated by the Task 1 checkpoint)
completed: 2026-07-08
status: complete
---

# Phase 1 Plan 4: graph-renderer-three Package Scaffolding + peerDependencies + D-07 Guard Verification Summary

**`packages/graph-renderer-three` scaffolded as the sole gateway package (besides react-knowledge-graph) permitted to depend on Three.js/R3F, with peerDependencies wired through the pnpm workspace `catalog:` protocol, and the Plan 01-02 D-07 ESLint block empirically proven to allow react/three/@react-three/fiber while still blocking a bare `fetch()` call.**

## Performance

- **Duration:** ~15 min total (Task 1's checkpoint required a human-verify pause between executor sessions; Tasks 2-3 executed in this continuation session)
- **Completed:** 2026-07-08

## Checkpoint Resolution

Task 1 (`checkpoint:human-verify`, package legitimacy gate for `three@0.185.1`) was presented to the human operator in a prior executor session per the Package Legitimacy Gate protocol — 01-RESEARCH.md's Package Legitimacy Audit flagged `three@0.185.1` as `[SUS]` (`too-new`, published 2026-07-01, 7 days before the research date), with ~11.1M weekly downloads and the long-established `github.com/mrdoob/three.js` repo — a recency-only flag, not an adoption/legitimacy concern. **The human operator responded "approved"**, confirming `three@0.185.1` exactly as specified in 01-RESEARCH.md / 01-04-PLAN.md, with no fallback version substitution.

## Accomplishments

- `packages/graph-renderer-three/package.json` created: `@gruporeacciona/graph-renderer-three`, `version: 0.0.0`, `private: true`, `type: module`, `main`/`types` pointing at `./dist`, `build`/`lint`/`typecheck` scripts matching graph-core's pattern, `"dependencies": { "@gruporeacciona/graph-core": "workspace:*" }`, and `"peerDependencies"` for all five of `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, each set to `"catalog:"` — confirmed via a direct `node -e` check against the file
- `packages/graph-renderer-three/tsconfig.json` created extending `../../tsconfig.base.json`, with `jsx: "react-jsx"`, `outDir`/`rootDir`/`tsBuildInfoFile` under `./dist`, `include: ["src"]`, and `references: [{ "path": "../graph-core" }]` — resolving its project reference to graph-core only, matching `docs/03-architecture.md`'s dependency direction
- `packages/graph-renderer-three/src/index.ts` created as a minimal placeholder (comment noting the real R3F scene/camera/selection logic lands in Phase 3, VIEWER-01..08) — enough for `tsc --build` to have a valid, non-empty compilation unit
- `pnpm install` resolved the new workspace package; `pnpm why three` (run from repo root) showed **exactly one resolved version of `three`** in the entire dependency tree (including transitive `@react-three/drei` deps like `@monogrid/gainmap-js`, `three-stdlib`, `troika-three-text`, etc. — all deduped to the single top-level `three@0.185.1`), empirically confirming the peerDependencies-not-dependencies declaration prevents duplicate instances
- `pnpm exec turbo run build --filter=@gruporeacciona/graph-renderer-three` succeeded: 2 tasks (graph-core build cache hit + graph-renderer-three build), producing real `dist/index.js`, `dist/index.d.ts`, `dist/index.d.ts.map`
- **Empirically proved the D-07 ESLint guard allows legitimate framework usage (the opposite check from graph-core's D-05):** temporarily added `import * as React from 'react'; import * as THREE from 'three'; import { Canvas } from '@react-three/fiber';` to `src/index.ts` → `eslint packages/graph-renderer-three` exited clean (`ESLint: No issues found`) — proving D-07 does not over-block legitimate React/Three usage in this package
- **Empirically proved the D-07 ESLint guard still blocks backend calls:** removed the framework imports, temporarily added `fetch('http://example.com');` → `eslint packages/graph-renderer-three` failed with 1 error, `ruleId: no-restricted-globals` — exactly the mechanism RESEARCH.md's Pitfall 1 describes
- `packages/graph-renderer-three/src/index.ts` was restored byte-for-byte to Task 2's placeholder content — `git diff --stat HEAD -- packages/graph-renderer-three/src/index.ts` confirms zero residual diff, and a final `eslint packages/graph-renderer-three` run passed clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Package legitimacy check for `three`** - no commit (checkpoint-only, no files modified; human approval recorded in this SUMMARY's Checkpoint Resolution section)
2. **Task 2: Scaffold packages/graph-renderer-three with peerDependencies** - `cdcb5ab` (feat)
3. **Task 3: Empirically verify the D-07 architecture guard against graph-renderer-three** - no commit (verification-only task; temporary react/three/@react-three/fiber imports and `fetch()` trial were reverted before completion, leaving zero diff against Task 2's committed state — nothing new to commit)

**Plan metadata:** commit pending (this SUMMARY, created immediately after this file — STATE.md/ROADMAP.md are updated by the orchestrator after all worktree agents in this wave complete)

## Files Created/Modified

- `packages/graph-renderer-three/package.json` - `@gruporeacciona/graph-renderer-three`, peerDependencies via catalog: for react/react-dom/three/@react-three/fiber/@react-three/drei, workspace:* dependency on graph-core
- `packages/graph-renderer-three/tsconfig.json` - extends root base, jsx: react-jsx, references ../graph-core only
- `packages/graph-renderer-three/src/index.ts` - placeholder entry point (Phase 3/VIEWER-01..08 will add real R3F scene logic)
- `pnpm-lock.yaml` - regenerated to link the new `packages/graph-renderer-three` workspace member and resolve its peerDependencies against the pnpm-workspace.yaml catalog

## Decisions Made

- Wrote `package.json`/`tsconfig.json`/`src/index.ts` directly with the `catalog:` protocol already in place, instead of running `pnpm --filter @gruporeacciona/graph-renderer-three add --save-peer react react-dom three @react-three/fiber @react-three/drei` first and then hand-editing each version string to `catalog:` (the plan's suggested two-step path). Both approaches converge on the identical final `package.json` content, since the catalog entries (`react ^19.2.7`, `react-dom ^19.2.7`, `three ^0.185.1`, `@react-three/fiber ^9.6.1`, `@react-three/drei ^10.7.7`) were already fixed in `pnpm-workspace.yaml` by Plan 01-01 — writing them directly avoids an unnecessary install-then-edit round trip while still running `pnpm install` and `pnpm why three` afterward to empirically prove the workspace correctly resolves the declaration (satisfying the plan's actual acceptance criteria, not just its suggested mechanism).
- Task 1 and Task 3 produced no commits: Task 1 is checkpoint-only (no files modified, human approval is recorded here); Task 3's own spec explicitly frames the react/three/@react-three/fiber and `fetch()` trials as temporary edits reverted before completion — after reverting, `git diff` shows zero changes versus Task 2's committed state.

## Deviations from Plan

None - plan executed exactly as written. The direct-write vs. `pnpm add --save-peer`-then-edit choice (see Decisions Made) is an equivalent implementation path to the plan's suggested mechanism, not a deviation from its stated intent or acceptance criteria — all of which were independently verified regardless of which path produced the file.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required beyond the Task 1 checkpoint approval already recorded above.

## Next Phase Readiness

- `packages/graph-renderer-three` is now a real, buildable, lint-clean TypeScript package with peerDependencies correctly wired via the pnpm workspace catalog — ready for `react-knowledge-graph` (Plan 01-05) to depend on it and for `examples/*` (Plan 01-07) to prove the peerDependencies contract end-to-end with a real consumer.
- The D-07 ESLint block is now empirically confirmed to both allow legitimate React/Three usage and block backend calls in a real package — Plan 01-05 (react-knowledge-graph, D-06) and any future graph-renderer-three work can rely on the same mechanism without re-deriving it from scratch.
- Root `tsconfig.json`'s solution-style `references` array still points at two package directories that do not yet exist (`react-knowledge-graph`, `adapters/codebase-memory`) — this remains expected/intentional until Plans 01-05/01-06 complete.
- No blockers for Plan 01-05.

---
*Phase: 01-repo-scaffolding-compliance-gates*
*Completed: 2026-07-08*

## Self-Check: PASSED

All created files confirmed present on disk (packages/graph-renderer-three/package.json, packages/graph-renderer-three/tsconfig.json, packages/graph-renderer-three/src/index.ts, this SUMMARY.md). Task 2 commit hash (cdcb5ab) confirmed present in `git log --oneline --all`. Task 1 and Task 3 produced no commits by design (checkpoint-only / verification-only, zero residual diff).
