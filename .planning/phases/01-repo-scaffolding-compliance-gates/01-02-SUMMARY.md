---
phase: 01-repo-scaffolding-compliance-gates
plan: 02
subsystem: infra
tags: [eslint, github-actions, ci, license-compliance, legal-attribution]

# Dependency graph
requires:
  - phase: 01-repo-scaffolding-compliance-gates
    provides: "pnpm/Turborepo/TypeScript monorepo root scaffolding (Plan 01-01) with zero workspace packages yet populated"
provides:
  - "eslint.config.js with four scoped flat-config blocks (D-05..D-08) enforcing per-package architecture boundaries (graph-core, react-knowledge-graph, graph-renderer-three, adapters/*)"
  - ".github/workflows/ci.yml wiring install -> turbo run build/lint/typecheck -> license-compliance gate"
  - "Finalized NOTICE.md with real SHA/tag/copyright/full MIT text (zero placeholder language)"
  - "PROJECT.md Key Decisions table updated to reflect D-04"
affects: [01-03-graph-core, 01-04-graph-renderer-three, 01-05-react-knowledge-graph, 01-06-adapters-codebase-memory, 01-08-verification-slice]

# Tech tracking
tech-stack:
  added: ["@eslint/js@10.0.1"]
  patterns: ["ESLint flat-config with parserOptions.projectService: true for nested monorepo typed linting", "no-restricted-imports + no-restricted-globals paired per package (fetch is a global, not an import)", "license-checker-rseidelsohn --failOn with exact enumerated SPDX identifiers (never a bare GPL/LGPL prefix)"]

key-files:
  created: [eslint.config.js, .github/workflows/ci.yml, NOTICE.md]
  modified: [package.json, pnpm-lock.yaml, .planning/PROJECT.md]

key-decisions:
  - "Added @eslint/js@10.0.1 as a root devDependency — required by eslint.config.js's js.configs.recommended per PATTERNS.md's exact reference implementation, but was not yet installed by Plan 01-01. Verified as the official ESLint-team-maintained package (openjsfoundation/eslintbot maintainers, MIT) before installing, per the package-legitimacy safeguard."
  - "licenses:check script now invokes the locally installed license-checker-rseidelsohn binary directly (not pnpm dlx) so local runs match the already-pinned root devDependency instead of re-resolving a possibly different version."

requirements-completed: [INFRA-03, INFRA-04, INFRA-05]

coverage:
  - id: D1
    description: "eslint.config.js contains four files-scoped blocks (D-05 graph-core, D-06 react-knowledge-graph, D-07 graph-renderer-three, D-08 adapters/*) each with no-restricted-imports for the correct per-package boundary; D-05/D-06/D-07 pair it with no-restricted-globals to catch bare fetch()"
    requirement: "INFRA-03"
    verification:
      - kind: unit
        ref: "node --check eslint.config.js && grep -c no-restricted-globals eslint.config.js (== 3) && grep -q projectService eslint.config.js (manual command invocation)"
        status: pass
    human_judgment: false
  - id: D2
    description: ".github/workflows/ci.yml wires actions/checkout -> pnpm/action-setup -> setup-node -> pnpm install --frozen-lockfile -> pnpm exec turbo run build lint typecheck -> license-compliance gate with an exact enumerated SPDX --failOn deny-list (GPL/AGPL/SSPL variants only); no publish step/token anywhere in the workflow or package.json"
    requirement: "INFRA-04"
    verification:
      - kind: unit
        ref: "grep -q 'turbo run build lint typecheck' .github/workflows/ci.yml && grep -q failOn .github/workflows/ci.yml && ! grep -riE 'npm publish|pnpm publish|NPM_TOKEN' .github/workflows/ci.yml package.json (manual command invocation)"
        status: pass
    human_judgment: false
  - id: D3
    description: "NOTICE.md finalized with the real upstream repo, pinned tag v0.8.1, SHA f0c9be19c5d74b84f418d807bfdce7b5d6a261ff, copyright (c) 2025 DeusData, and the full inline MIT license text; zero remaining placeholder language; PROJECT.md's Key Decisions table row reflects the Phase 1 finalization while preserving the Phase 3 re-verification caveat"
    requirement: "INFRA-05"
    verification:
      - kind: unit
        ref: "grep -q f0c9be19... NOTICE.md && grep -qi 'MIT License' NOTICE.md && ! grep -qi 'replace this notice with the exact upstream' NOTICE.md (manual command invocation)"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-07-08
status: complete
---

# Phase 1 Plan 2: ESLint Architecture Guards, CI License Gate, Legal Attribution Summary

**Four-package ESLint architecture-boundary flat-config (D-05..D-08), a GitHub Actions CI pipeline with an exact-SPDX license-compliance gate (D-13), and a finalized NOTICE.md with real SHA/tag/MIT text — all wired before any package or feature code exists.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-08T12:20:00Z (approx.)
- **Completed:** 2026-07-08T12:30:36Z
- **Tasks:** 3 (all auto)
- **Files modified:** 6 (3 created new: eslint.config.js, .github/workflows/ci.yml, NOTICE.md; 3 modified: package.json, pnpm-lock.yaml, .planning/PROJECT.md)

## Accomplishments
- `eslint.config.js` created with `js.configs.recommended` + `tseslint.configs.recommended` base and four `files`-scoped blocks matching D-05 (`graph-core`: blocks react/react-dom/three/@react-three/*/axios/useQuery+fetch), D-06 (`react-knowledge-graph`: allows react/react-dom, blocks three/@react-three/*/backend-calls+fetch), D-07 (`graph-renderer-three`: allows react/three/@react-three/*, blocks backend-calls+fetch), and D-08 (`adapters/*`: blocks react/react-dom/three/@react-three/*, no backend-call block per spec)
- Every block requiring the fetch guard (D-05/D-06/D-07) pairs `no-restricted-imports` with `no-restricted-globals`, since `fetch` is a global identifier `no-restricted-imports` alone cannot catch (RESEARCH.md Pitfall 1)
- `parserOptions.projectService: true` used (not a manual `project: [...]` glob array) so the nested `packages/adapters/codebase-memory/tsconfig.json` is not silently skipped by typed linting (RESEARCH.md Pitfall 4)
- `.github/workflows/ci.yml` created: triggers on `push` to `main` and `pull_request`; installs via `pnpm install --frozen-lockfile`; runs `pnpm exec turbo run build lint typecheck`; gates on `license-checker-rseidelsohn --failOn` with the exact enumerated SPDX deny-list (`GPL-1.0-only;...;SSPL-1.0`) — deliberately not a bare `"GPL"`/`"LGPL"` prefix (RESEARCH.md Pitfall 3) and not `--onlyAllow` (would collapse the manual-review tier into the blocked tier)
- Root `package.json`'s `licenses:check` script rewired from the placeholder `echo` stub to the real `license-checker-rseidelsohn` invocation with the same deny-list, runnable locally
- No publish step, publish token, or auto-publish trigger added anywhere (verified via grep across the workflow and `package.json`) — publication remains gated on prior Reacciona approval
- `NOTICE.md` finalized: real upstream repo (`github.com/DeusData/codebase-memory-mcp`), pinned tag `v0.8.1`, SHA `f0c9be19c5d74b84f418d807bfdce7b5d6a261ff`, `Copyright (c) 2025 DeusData`, and the full inline MIT license text — zero remaining placeholder language from the original stub file
- Added an explicit standing instruction in `NOTICE.md` for the Phase 3 executor to re-query the GitHub API for a newer release before copying any code, rather than assuming `v0.8.1` remains current (D-03)
- `.planning/PROJECT.md`'s Key Decisions table row for the source-commit pin updated to reflect the Phase 1 `NOTICE.md` finalization while preserving the binding Phase 3 re-verification caveat (D-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: ESLint architecture-boundary guard (D-05..D-08)** - `9eb2695` (feat)
2. **Task 2: CI pipeline — install, Turbo tasks, license-compliance gate (D-13)** - `b2ed8f3` (feat)
3. **Task 3: Finalize legal attribution (D-01..D-04)** - `e950fdc` (docs)

**Plan metadata:** commit pending (this SUMMARY + STATE.md + ROADMAP.md docs commit, created immediately after this file)

## Files Created/Modified
- `eslint.config.js` - four D-05..D-08 scoped architecture-boundary blocks, `projectService: true`
- `.github/workflows/ci.yml` - install → turbo run → license-compliance gate CI pipeline
- `NOTICE.md` - finalized legal attribution (real SHA/tag/copyright/full MIT text)
- `package.json` (root) - added `@eslint/js` devDependency; rewired `licenses:check` script to the real tool
- `pnpm-lock.yaml` - regenerated after adding `@eslint/js`
- `.planning/PROJECT.md` - Key Decisions table row updated per D-04

## Decisions Made
- Installed `@eslint/js@10.0.1` as a root devDependency: required by the plan's own literal reference implementation (`import js from '@eslint/js'`) but not yet present from Plan 01-01. Verified as the official ESLint-team package before adding (Rule 3 — blocking issue, legitimate well-known package, not a slopsquatting risk).
- `licenses:check` invokes the locally pinned `license-checker-rseidelsohn` binary directly rather than `pnpm dlx`, so local runs are guaranteed to use the same version pinned in `package.json`/`pnpm-lock.yaml` instead of potentially re-resolving a different version from the registry.
- Did not add a separate non-blocking "warn" CI step for the manual-review license tier (MPL/LGPL/EPL) mentioned in CONTEXT.md's D-13 prose. The plan's Task 2 action and acceptance criteria only specify the `--failOn` gate itself (which already does not block that tier); PATTERNS.md flags the optional warning step as explicitly unresolved/deferred rather than a locked requirement, and the plan's own acceptance criteria do not test for it. No scope was added beyond what the plan concretely specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing `@eslint/js` devDependency**
- **Found during:** Task 1 (ESLint architecture-boundary guard)
- **Issue:** `eslint.config.js` per PATTERNS.md's exact reference implementation imports `js from '@eslint/js'`, but that package was never installed by Plan 01-01 (only `eslint` and `typescript-eslint` were pinned) — `require.resolve('@eslint/js')` failed.
- **Fix:** Verified `@eslint/js` on the npm registry (maintainers `openjsfoundation`/`eslintbot`, MIT, official ESLint org package, no anomalies) then ran `pnpm add -D -w @eslint/js@10.0.1`.
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Verification:** `node --check eslint.config.js` passes; `pnpm exec eslint --print-config eslint.config.js` emits valid config JSON.
- **Committed in:** `9eb2695` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to make Task 1's literal reference implementation actually load. No scope creep — no alternative/similarly-named package was substituted, the exact package named by the plan's own instructions was installed after registry verification.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required. (CI will only actually execute on GitHub once a PR/push occurs; no manual GitHub Actions setup is needed since the workflow file alone is sufficient for GitHub to pick it up.)

## Next Phase Readiness
- `eslint.config.js`'s four `files` globs are ready to be empirically re-verified by each of Plans 01-03..01-06 once real files exist under `packages/graph-core/`, `packages/react-knowledge-graph/`, `packages/graph-renderer-three/`, and `packages/adapters/*` — no further edits to this file are expected from those plans.
- `.github/workflows/ci.yml`'s `license-compliance` step is ready to be empirically tested against a real GPL/LGPL scratch dependency in Plan 01-08's verification slice (per RESEARCH.md Pitfall 3's recommended test).
- `NOTICE.md` is finalized for Phase 1's purposes; Phase 3 MUST re-verify the pin against the latest `codebase-memory-mcp` release before copying any code, per the standing instruction now embedded in the file itself.
- No blockers for Plan 01-03.

---
*Phase: 01-repo-scaffolding-compliance-gates*
*Completed: 2026-07-08*

## Self-Check: PASSED

All created/modified files confirmed present on disk (eslint.config.js, .github/workflows/ci.yml, NOTICE.md, package.json, .planning/PROJECT.md, this SUMMARY.md). All three task commit hashes (9eb2695, b2ed8f3, e950fdc) confirmed present in `git log --oneline --all`.
