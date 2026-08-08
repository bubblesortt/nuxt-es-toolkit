# Package Roadmap Design: v2.1, v2.2, and v3.0

Status: approved  
Date: 2026-08-08

## Context

`@bubblesortt/nuxt-es-toolkit` v2.0.0 already provides configurable Nuxt auto-imports for the base and compat `es-toolkit` surfaces, per-method source overrides, allowlists, aliases, prefixes, collision validation, and opt-in FP, Map, and Set entrypoints.

The package currently imports all five runtime barrels during Nuxt module setup so that it can inspect their export names. This is convenient and automatically follows new `es-toolkit` exports, but it also evaluates hundreds of utility modules before the application uses any of them. The resulting setup cost is the first problem this roadmap addresses.

Recent upstream additions include the FP entrypoint, `flow`, declaration-only utility types, AbortSignal support, and a Node-specific server entrypoint. Root, FP, Map, and Set additions are already discovered by the module's wildcard barrels. The `server` and `types` entrypoints are intentionally excluded from this roadmap: both offer limited auto-import value, while server helpers are Node-specific and global types increase hidden TypeScript context.

Nuxt 3 reached end of life on 2026-07-31. Backward-compatible v2 releases will retain Nuxt 3 support, followed by a deliberate v3 boundary for Nuxt 4.5 and later.

## Goals and Principles

- Deliver each release as an independently testable and publishable unit.
- Preserve all v2.0.0 configuration and generated-import behaviour through v2.1 and v2.2.
- Measure before changing implementation and compare before/after results in the same environment.
- Keep runtime imports tree-shakeable and preserve reliable pnpm dependency resolution.
- Make diagnostics opt-in and deterministic.
- Avoid presets, wrapper utilities, DevTools UI, server auto-imports, and type-only auto-imports until real user demand justifies them.
- Do not publish or create a release as part of implementation work.

## Release Boundaries

### v2.1: Setup Performance

Replace setup-time execution of `es-toolkit` runtime barrels with a generated export catalogue. Keep Nuxt 3 and 4 support and make no public option changes.

### v2.2: Import Diagnostics

Add opt-in, machine-readable visibility into import selection without changing default behaviour. The report explains which candidates were registered, excluded, unavailable, or overridden.

### v3.0: Nuxt 4/5 Foundation

Require Nuxt 4.5 or later, test Nuxt 5 compatibility behaviour and both supported builders, and remove Nuxt 3-specific fixtures and compatibility paths. The v2 branch remains available only for critical Nuxt 3 correctness or security fixes.

## Measurement Strategy

### Exploratory v2.0.0 Baseline

The initial local sample was captured at Git commit `73de49b` on macOS arm64, Node 25.9.0, and pnpm 10.34.5. These values establish the scenarios, but they are not canonical release gates because Node 25 is outside the project's CI matrix.

| Metric | Current value |
| --- | ---: |
| Cold `@nuxt/kit` import, median / p95 | 79.3 / 86.1 ms |
| Cold module import, median / p95 | 174.9 / 180.0 ms |
| Incremental module import cost | approximately 95.6 ms |
| Incremental RSS | approximately 17.4 MiB |
| Warm `nuxi prepare`, median | 1734.2 ms |
| Default generated auto-imports | 185 |
| Generated `imports.d.ts` size | 9114 bytes |
| Playground client JavaScript, raw / gzip | 146732 / 56228 bytes |

The authoritative baseline must be recaptured on Node 24 before the v2.1 refactor.

### Benchmark Harness

The benchmark harness is the first v2.1 deliverable. It must:

- launch cold module measurements in separate Node processes;
- perform warmup iterations and at least 20 measured microbenchmark iterations;
- report median, p95, minimum, maximum, and RSS;
- record Git SHA, operating system, architecture, Node, pnpm, Nuxt, module, and `es-toolkit` versions;
- measure cold module import, warm `nuxi prepare`, generated import count, declaration size, and representative client bundle size;
- emit versioned JSON under ignored `.bench/` paths;
- compare a baseline ref and candidate ref on the same Node 24 CI runner;
- publish JSON artifacts and a readable GitHub Actions job summary.

Correctness, import-manifest, and bundle-size regressions are blocking. Overall Nuxt prepare time is reported but is not a hard threshold because Nuxt dominates that measurement. Time and RSS thresholds use paired runs on one runner rather than values from unrelated workflow runs.

## v2.1 Technical Design

### Generated Export Catalogue

Add the committed file `src/generated/es-toolkit-exports.ts`. It contains the source `es-toolkit` version and sorted `as const` arrays for the base, compat, FP, Map, and Set export surfaces. It contains names only and never imports utility implementations.

Public method union types are derived from these arrays instead of `keyof` namespace imports. This preserves autocomplete while removing runtime surface evaluation from `src/module.ts`.

### Generation and Drift Detection

Add two development commands:

```bash
pnpm generate:exports
pnpm check:exports
```

`generate:exports` loads installed entrypoints in the maintainer environment, renders stable sorted output, and updates the committed catalogue. `check:exports` produces the expected output in memory and fails if the committed catalogue differs. It also fails on missing entrypoints, duplicate names, empty required surfaces, or a version mismatch.

There is no consumer `postinstall`, network request, or package scan during Nuxt startup. CI runs the drift check whenever source, dependency, or lockfile inputs change.

### Import Planner

Change planner inputs from namespace-like objects to name arrays:

```ts
surfaces: {
  base: readonly string[]
  compat: readonly string[]
}
```

Entrypoint definitions likewise receive arrays. Selection, source overrides, includes, excludes, aliases, prefixing, validation, and collision handling retain their existing semantics.

### Runtime Resolution

Keep `src/runtime/es-toolkit-*.ts` as the actual Nuxt import sources. They ensure that injected imports resolve `es-toolkit` relative to this package under strict pnpm layouts. Pointing application-generated imports directly at a transitive dependency is explicitly out of scope.

Only catalogue discovery changes. The generated Nuxt import manifest and final application bundles should therefore remain semantically identical.

### v2.1 Work Sequence

1. Add the benchmark harness and versioned result format.
2. Capture and retain the Node 24 v2.0.0 baseline artifacts.
3. Add failing catalogue-generation and drift tests.
4. Generate and commit the export catalogue.
5. Add failing planner tests for array-based surfaces.
6. Move public method types and planner inputs to the catalogue.
7. Remove setup-time namespace imports while retaining runtime barrels.
8. Run the full correctness, type, package, bundle, and performance suites.
9. Update user and contributor documentation and prepare release notes without releasing.

### v2.1 Success Criteria

- Runtime `es-toolkit` surfaces are not evaluated while loading the Nuxt module.
- Median incremental cold-import time is reduced by at least 70% from the paired v2.0.0 baseline.
- Incremental RSS is reduced by at least 50% from the paired v2.0.0 baseline.
- Import names, sources, and selection results are semantically identical to v2.0.0.
- The default configuration still registers 185 imports with `es-toolkit@1.50.0`.
- Representative client and server bundles grow by no more than 1%.
- Warm `nuxi prepare` does not regress materially and its result is included in the benchmark report.
- All existing checks plus catalogue drift and benchmark comparison pass.

## v2.2 Technical Design

### Public Option

Add one option with a false default:

```ts
diagnostics?: boolean
```

When enabled, the module emits one summary log and writes a detailed report. It does not modify the chosen imports. Log levels, custom paths, presets, and UI are deferred.

### Report Contract

Write the report through the Nuxt build/template lifecycle at:

```text
.nuxt/es-toolkit/imports.json
```

The real location follows `nuxt.options.buildDir`. The report includes `schemaVersion: 1`, module and `es-toolkit` versions, summary counters, final imports, and candidate decisions. It excludes timestamps, absolute paths, secrets, and machine-specific data. Object fields use a fixed serialization order, surfaces use a documented order, and candidates are ordered by export name within each surface so equivalent configuration produces byte-identical JSON.

Each candidate is identified by `surface + exportName` and receives exactly one status:

- `registered`: added to Nuxt imports;
- `excluded`: removed by defaults, user exclusion, or an include allowlist;
- `unavailable`: its surface or entrypoint is disabled;
- `overridden`: another source was selected for the logical method.

Stable reason codes include:

- `selected-by-mode`
- `explicitly-included`
- `entrypoint-enabled`
- `default-excluded`
- `user-excluded`
- `not-included`
- `surface-disabled`
- `entrypoint-disabled`
- `compat-preferred`
- `method-override`

Registered entries contain the original name, logical surface and source, final alias, prefix application, and whether the alias was user-supplied.

### Optional Planner Trace

Introduce a plan result containing final imports and optional decisions:

```ts
{
  imports: PlannedImport[]
  decisions?: ImportDecision[]
}
```

Decision tracing is enabled only when diagnostics are enabled. The normal path must not allocate the detailed decision collection. Invalid configuration continues to stop setup with the existing actionable error and does not produce a new report.

### Nuxt Integration

When diagnostics are enabled, register the JSON through Nuxt's generated build files and log a single summary with the relative report path. Existing warnings for unknown exclusions and aliases remain independent of diagnostics.

When diagnostics are disabled, no report template or summary log is registered. Previously generated `.nuxt` content remains governed by Nuxt's build-directory lifecycle.

### v2.2 Work Sequence

1. Define report types, schema version, statuses, and reason codes in failing unit tests.
2. Add opt-in decision tracing to the planner.
3. Implement deterministic report serialization.
4. Integrate the generated report and summary log with Nuxt.
5. Add fixtures for base, compat, includes, aliases, overrides, and entrypoints.
6. Verify report counters against actual generated Nuxt imports.
7. Run paired v2.1/candidate performance, RSS, declaration, and bundle comparisons.
8. Verify every v2.2 success gate.
9. Document the option and report contract and prepare release notes without releasing.

### v2.2 Success Criteria

- Disabled diagnostics register no report template and produce no additional summary log.
- Disabled diagnostics regress median setup by no more than 2% relative to v2.1.
- Enabled diagnostics produce deterministic, versioned JSON under the Nuxt build directory.
- Every candidate appears exactly once with a valid status and reason.
- Report counters exactly match the imports registered with Nuxt.
- Every final import records its source, surface, original name, alias, and selection reason.
- Enabled diagnostics add no more than 10 ms median setup time and 2 MiB RSS.
- Schema, serialization, and all selection paths are covered by tests and user documentation.

## v3.0 Foundation

v3.0 is a later roadmap stage, not part of the immediate v2.1/v2.2 implementation session. It will:

- require Nuxt 4.5 or later;
- test `future.compatibilityVersion: 5`;
- test Vite and Rspack;
- remove Nuxt 3 fixtures and compatibility paths;
- retain v2 import behaviour unless a separately approved design changes it;
- add stable Nuxt 5 to CI when available.

### v3.0 Success Criteria

- CI passes on Nuxt 4.5+, compatibility version 5, Vite, and Rspack.
- Nuxt versions below 4.5 receive an actionable compatibility failure.
- Nuxt 3-specific code and fixtures are removed.
- Existing base, compat, include, alias, prefix, and entrypoint scenarios remain correct.
- Setup performance regresses by no more than 10% from v2.2 in paired measurements.
- The diagnostics schema remains compatible or has a documented migration.
- The migration guide and v2 maintenance policy are published with the eventual release.

## Branch and Release Sequencing

Use dependent feature branches:

```text
main
└── feature/v2.1-setup-performance
    └── feature/v2.2-import-diagnostics
```

v2.1 is developed from current `main`. v2.2 begins from the completed v2.1 tip because it depends on the catalogue-aware planner and benchmark harness. After v2.1 is merged, v2.2 is rebased onto its final commit or tag. Neither implementation branch publishes the package.

The implementation phase must create separate execution plans:

```text
docs/superpowers/plans/2026-08-08-v2.1-setup-performance.md
docs/superpowers/plans/2026-08-08-v2.2-import-diagnostics.md
```

Each plan must name concrete files, start behaviour changes with failing tests, list verification commands and expected outcomes, repeat the applicable success checklist, and propose narrow Conventional Commit boundaries.

## Verification Matrix

v2.x retains the current support matrix:

- Nuxt 3 on Node 20;
- Nuxt 4 on Node 24;
- ESLint, Vitest, module and playground type checking;
- production playground build;
- package build and publint.

v2.1 additionally requires catalogue drift checks, import-manifest comparison, and v2.0.0 performance comparison. v2.2 additionally requires report schema, determinism, reconciliation, and v2.1 performance comparison.

A version is ready only after functional criteria, correctness gates, bundle gates, paired performance thresholds, benchmark artifacts, and documentation all pass. Missing a performance threshold blocks readiness until the cause is resolved or the criterion is explicitly redesigned from new evidence.

## Risks and Mitigations

- **Catalogue drift:** committed generation plus a CI drift check prevents silent mismatch after dependency upgrades.
- **Benchmark noise:** compare refs on the same runner, use subprocess isolation, warmups, multiple iterations, median, and p95.
- **pnpm resolution failures:** retain package-owned runtime barrels instead of injecting imports from a transitive package specifier.
- **Diagnostics overhead:** keep detailed tracing behind a boolean and benchmark both disabled and enabled paths.
- **Unstable report consumers:** declare and test a numeric schema version while keeping v2.2 fields intentionally small.
- **Scope expansion:** defer server/types auto-imports, presets, DevTools, and runtime wrappers until separate evidence and design approval exist.

## References

- [es-toolkit v1.47.0](https://github.com/toss/es-toolkit/releases/tag/v1.47.0)
- [es-toolkit v1.48.0](https://github.com/toss/es-toolkit/releases/tag/v1.48.0)
- [es-toolkit v1.49.0](https://github.com/toss/es-toolkit/releases/tag/v1.49.0)
- [es-toolkit v1.50.0](https://github.com/toss/es-toolkit/releases/tag/v1.50.0)
- [Nuxt 4.5 release](https://nuxt.com/blog/v4-5)
- [Nuxt Kit server imports](https://nuxt.com/docs/4.x/api/kit/nitro#addserverimports)
- [Nuxt auto-import discussion](https://github.com/nuxt/nuxt/issues/29923)
