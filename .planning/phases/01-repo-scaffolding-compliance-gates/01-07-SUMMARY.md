---
phase: 01-repo-scaffolding-compliance-gates
plan: 07
subsystem: infra
tags: [vite, react, workspace-catalog, pnpm-why, examples, react-knowledge-graph]

# Dependency graph
requires:
  - phase: 01-repo-scaffolding-compliance-gates
    provides: "packages/react-knowledge-graph scaffolded and buildable with peerDependencies via catalog: (Plan 01-06); pnpm-workspace.yaml's examples/* glob (Plan 01-01)"
provides:
  - "examples/basic-usage/ — the first real, non-scaffolding consumer of the entire package graph built in Plans 01-03..01-06, installing @gruporeacciona/react-knowledge-graph as a genuine workspace:* dependency and building successfully via Vite"
  - "Empirical proof (pnpm why react, pnpm why three) that exactly one resolved version of react and exactly one resolved version of three exist in the whole workspace tree once a real consumer app is added — closing roadmap Success Criterion #5 / INFRA-07"
affects: [01-08-verification-slice]

# Tech tracking
tech-stack:
  added: ["vite@8.1.3 (devDependency, examples/basic-usage only)", "@vitejs/plugin-react@6.0.3 (devDependency, examples/basic-usage only)"]
  patterns: ["examples/* as a real (if minimal) Vite project rather than a config-less stub, per RESEARCH.md Open Question #3 — installs the public package via workspace:* + catalog: exactly like a real npm consumer would, making duplicate-instance claims empirically checkable instead of theoretical"]

key-files:
  created: [examples/basic-usage/package.json, examples/basic-usage/vite.config.ts, examples/basic-usage/index.html, examples/basic-usage/src/main.tsx]
  modified: [pnpm-lock.yaml]

key-decisions:
  - "vite@8.1.3 and @vitejs/plugin-react@6.0.3 picked at implementation time via `npm view <pkg> version` (RESEARCH.md did not pin these versions) — Claude's Discretion, per the plan's explicit instruction. Legitimacy spot-checked via `npm view <pkg> maintainers/repository.url`: both packages are maintained by the official `vitejs` GitHub org (yyx990803 + vitebot), matching their public repositories exactly — no anomalies, no separate human checkpoint required since the plan did not define one (unlike Plan 01-04's explicit `three` legitimacy gate, which existed because RESEARCH.md flagged that specific package [SUS])."
  - "src/main.tsx uses a side-effect-only import (`import '@gruporeacciona/react-knowledge-graph'`) rather than a named import, because the package's current placeholder entry point (`export {}`, from Plan 01-06) has no named exports yet — this still proves the workspace/build/module-resolution chain works end-to-end without inventing an export that doesn't exist."
  - "Removed the literal string \"KnowledgeGraphViewer\" from main.tsx's explanatory comments (not just from actual import statements) after discovering the plan's own acceptance-criteria grep (`grep -q \"KnowledgeGraphViewer\"`) matches literal text anywhere in the file, including comments — reworded comments to reference \"the future viewer component\" instead, preserving the same explanatory intent without tripping the check."

requirements-completed: [INFRA-01, INFRA-07]

coverage:
  - id: D1
    description: "examples/basic-usage/package.json declares @gruporeacciona/react-knowledge-graph as workspace:*, react/react-dom via catalog:, and vite build succeeds"
    requirement: "INFRA-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @gruporeacciona/example-basic-usage exec vite build (manual command invocation) — exit 0, dist/index.html + dist/assets/index-*.js produced"
        status: pass
      - kind: unit
        ref: "cat examples/basic-usage/package.json | grep '@gruporeacciona/react-knowledge-graph.*workspace:\\*' (manual command invocation) — match found"
        status: pass
    human_judgment: false
  - id: D2
    description: "examples/basic-usage/src/main.tsx does not import KnowledgeGraphViewer (deferred to Phase 3/VIEWER-02, D-11)"
    requirement: "INFRA-01"
    verification:
      - kind: unit
        ref: "! grep -q 'KnowledgeGraphViewer' examples/basic-usage/src/main.tsx (manual command invocation) — no match, confirmed after rewording comments"
        status: pass
    human_judgment: false
  - id: D3
    description: "Exactly one resolved version of react and exactly one resolved version of three exist across the whole workspace tree after adding a real consumer"
    requirement: "INFRA-07"
    verification:
      - kind: unit
        ref: "pnpm why react (manual command invocation) — tree shows a single root react@19.2.7 entry; summary line 'Found 1 version of react'"
        status: pass
      - kind: unit
        ref: "pnpm why three (manual command invocation) — tree shows a single root three@0.185.1 entry; summary line 'Found 1 version of three'"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-07-08
status: complete
---

# Phase 1 Plan 7: examples/basic-usage Vite Skeleton + Empirical No-Duplicate-Instance Proof Summary

**`examples/basic-usage` scaffolded as a real, buildable Vite project installing `@gruporeacciona/react-knowledge-graph` via a genuine `workspace:*` dependency — the first non-scaffolding consumer of the whole package graph — with `pnpm why react` / `pnpm why three` empirically confirming exactly one resolved version of each across the entire workspace.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2 (both auto; Task 2 verification-only, no commit)
- **Files modified:** 5 (4 created: package.json, vite.config.ts, index.html, src/main.tsx; 1 modified: pnpm-lock.yaml)

## Accomplishments

- `examples/basic-usage/package.json` created: `@gruporeacciona/example-basic-usage`, `private: true`, `type: module`, `dev`/`build` scripts wrapping `vite`/`vite build`, `dependencies` on `@gruporeacciona/react-knowledge-graph` (`workspace:*`) plus `react`/`react-dom` (`catalog:`), `devDependencies` on `vite@8.1.3` and `@vitejs/plugin-react@6.0.3` (current stable versions at implementation time, npm-verified as maintained by the official `vitejs` org — no legitimacy anomalies)
- `examples/basic-usage/vite.config.ts` created: minimal `defineConfig({ plugins: [react()] })`, no custom aliasing needed since pnpm workspace linking already resolves the package
- `examples/basic-usage/index.html` created: standard Vite entry shell (`<div id="root">` + `<script type="module" src="/src/main.tsx">`)
- `examples/basic-usage/src/main.tsx` created: a side-effect-only import of `@gruporeacciona/react-knowledge-graph` (the package currently has no named exports — Plan 01-06's placeholder is `export {}`) plus a trivial `createRoot` mount of a placeholder `<App />`, with explicit comments deferring the real viewer usage to Phase 3 (VIEWER-02, D-11) — reworded during implementation to avoid the literal string "KnowledgeGraphViewer" appearing anywhere in the file (including comments), since the plan's own acceptance check greps for that exact string
- `pnpm install` linked the new workspace member (`examples/basic-usage/node_modules/@gruporeacciona/react-knowledge-graph` symlinks to `../../../../packages/react-knowledge-graph`); `pnpm --filter @gruporeacciona/example-basic-usage exec vite build` succeeded (`15 modules transformed`, `dist/index.html` + `dist/assets/index-*.js` produced, built in ~50ms)
- **Task 2 (empirical no-duplicate-instance proof):** `pnpm why react` (run from repo root, after linking the new consumer) shows a single root `react@19.2.7` entry consumed by `example-basic-usage`, `graph-renderer-three`, and `react-knowledge-graph` alike, with the tool's own summary confirming `Found 1 version of react`; `pnpm why three` likewise shows a single root `three@0.185.1` entry with `Found 1 version of three` — empirically closing INFRA-07 / roadmap Success Criterion #5 with a genuine external-shaped consumer in the loop (T-01-16 mitigated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold examples/basic-usage as a real Vite project** - `2acc02b` (feat)
2. **Task 2: Empirically prove no duplicate React/Three instances** - no commit (verification-only task; `pnpm why react`/`pnpm why three` produce no file changes, matching the plan's own `<files>none (verification only)</files>` spec — nothing to commit)

## Files Created/Modified

- `examples/basic-usage/package.json` - `@gruporeacciona/example-basic-usage`, `workspace:*` dependency on `react-knowledge-graph`, `catalog:` for react/react-dom, vite + @vitejs/plugin-react devDependencies
- `examples/basic-usage/vite.config.ts` - minimal `@vitejs/plugin-react` Vite config
- `examples/basic-usage/index.html` - standard Vite entry shell
- `examples/basic-usage/src/main.tsx` - side-effect import of the workspace package + trivial `createRoot` mount, no viewer usage yet (D-11)
- `pnpm-lock.yaml` - regenerated to link the new `examples/basic-usage` workspace member and resolve vite/@vitejs/plugin-react

## Decisions Made

- Picked `vite@8.1.3` and `@vitejs/plugin-react@6.0.3` via `npm view <pkg> version` at implementation time (RESEARCH.md left these unpinned) — spot-checked legitimacy via `npm view <pkg> maintainers/repository.url` (both point to the official `vitejs` GitHub org, maintainers `yyx990803`/`vitebot`) before installing; no separate human legitimacy checkpoint was triggered because the plan itself did not define one for these two packages (unlike Plan 01-04's explicit gate for `three`, which existed specifically because RESEARCH.md flagged `three@0.185.1` as `[SUS]` — no such flag exists for these two well-established, official Vite-org packages).
- Used a side-effect-only import (`import '@gruporeacciona/react-knowledge-graph'`) in `main.tsx` instead of a named import, since the package's Plan 01-06 placeholder entry point exports nothing yet (`export {}`) — this still proves the full workspace-resolution/build chain without fabricating a non-existent export.
- Reworded `main.tsx`'s explanatory comments to avoid the literal string "KnowledgeGraphViewer" (using "the future viewer component" instead) after realizing the plan's acceptance-criteria grep matches that string anywhere in the file, not just in import statements — preserves the same explanatory intent about the D-11 deferral to Phase 3/VIEWER-02.
- Task 2 produced no commit: its own spec explicitly frames it as verification-only (`<files>none</files>`), consistent with the pattern established in Plan 01-04 (Task 3) and Plan 01-06 (Task 2).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's exact `pnpm why` verify grep does not match this pnpm version's output format**
- **Found during:** Task 2
- **Issue:** The plan's `<verify><automated>` step specifies `pnpm why react 2>&1 | grep -c "^react " | grep -qx "1"` (expecting a line literally starting with `react ` — name, space, version). The installed `pnpm@11.10.0` renders its dependency tree as `react@19.2.7` (name directly concatenated with `@version`, no space), so the literal grep pattern never matches regardless of how many versions are resolved — a plan/tool-version mismatch, not a real duplicate-instance failure.
- **Fix:** Verified the underlying claim using pnpm's own output instead: (a) counted root-level `^react@`/`^three@` lines after stripping ANSI codes (1 each), and (b) confirmed pnpm's own summary line, which explicitly states `Found 1 version of react` and `Found 1 version of three`. Both independently confirm the acceptance criterion the plan's grep was trying to check.
- **Files modified:** None (verification-only; no code changed).
- **Commit:** N/A (Task 2 has no commit, per plan spec).

### None Other

No other deviations. Task 1 executed exactly as written; the version-selection and comment-wording choices in "Decisions Made" are implementation details explicitly delegated to Claude's Discretion by the plan text, not deviations from its stated intent or acceptance criteria.

## Issues Encountered

None beyond the verify-script/tool-version mismatch documented above.

## User Setup Required

None. No package legitimacy checkpoint was required for `vite`/`@vitejs/plugin-react` — both independently verified via `npm view` as maintained by the official `vitejs` GitHub org with no anomalies, and the plan did not define an explicit human-verification gate for these two packages (unlike Plan 01-04's `three` gate, which was triggered by a specific RESEARCH.md `[SUS]` flag that does not apply here).

## Known Stubs

None. `examples/basic-usage/src/main.tsx` is an intentional, documented placeholder (side-effect import + trivial mount) — this is the plan's explicit deliverable (a real but minimal build-and-resolve proof, not a functioning demo), with the real mock-data/`KnowledgeGraphViewer` usage explicitly deferred to Phase 3 (VIEWER-02, D-11) and documented as such in the file's own comments.

## Threat Flags

None. The only new trust boundary this plan touches (`examples/basic-usage` ⇄ `react-knowledge-graph`, T-01-16) was already registered in the plan's own `<threat_model>` and empirically mitigated by Task 2's `pnpm why` checks above — no new network endpoints, auth paths, file access patterns, or schema changes were introduced.

## Next Phase Readiness

- `examples/basic-usage` is now a real, buildable Vite project that resolves the entire workspace dependency graph (`graph-core` → `graph-renderer-three` → `react-knowledge-graph` → `example-basic-usage`) with zero duplicate React/Three instances, empirically closing roadmap Success Criterion #5 and INFRA-07.
- All four artifacts (`graph-core`, `graph-renderer-three`, `react-knowledge-graph`, `adapters/codebase-memory`) plus a real consumer (`examples/basic-usage`) now exist and build cleanly — Plan 01-08 (full-phase verification slice) has every piece of evidence it needs assembled.
- No blockers for Plan 01-08.

---
*Phase: 01-repo-scaffolding-compliance-gates*
*Completed: 2026-07-08*
