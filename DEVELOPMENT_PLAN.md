# Nuxt ES Toolkit Development Plan

## Goal and Constraints

Prepare a locally verified release train that modernizes dependencies, makes auto-import generation predictable, expands opt-in functionality, and provides a clean migration path for safer defaults. Work stays local: do not bump the package version, create tags, publish to npm, push branches, or run the `release` script.

## Execution Status — 2026-08-07

- [x] v1.0.12 maintenance foundation
- [x] v1.1.0 import controls and validation
- [x] v1.2.0 opt-in FP, Map, and Set entrypoints
- [x] v2.0.0 compat semantics, safer defaults, and migration guide
- [x] Full quality gate, production audit, package inspection, and packed Nuxt 3/4 consumer builds

TypeScript 7 remains deferred until `@nuxt/module-builder` declares support. `es-toolkit/server` remains deferred until a dedicated Nuxt server-only API is designed and tested. No version bump, release commit, tag, publication, push, or other remote operation was performed.

Each release branch is stacked on the previous one so it can later be merged and released in order:

1. `feature/v1.0.12-maintenance` from `main`
2. `feature/v1.1.0-import-controls` from `feature/v1.0.12-maintenance`
3. `feature/v1.2.0-entrypoints` from `feature/v1.1.0-import-controls`
4. `feature/v2.0.0-defaults` from `feature/v1.2.0-entrypoints`

Commits use Conventional Commits (`fix:`, `feat:`, `test:`, `docs:`, `chore:`) and remain narrowly scoped. Generated output (`dist/`, `.nuxt/`, `.output/`) is never committed.

## Phase 1 — v1.0.12 Maintenance

Deliver a low-risk patch release foundation.

- Pin `es-toolkit` to the verified release and refresh Nuxt/test/lint tooling to mutually compatible versions.
- Keep TypeScript 5.9 until `@nuxt/module-builder` officially accepts TypeScript 7.
- Remove known `defu` and `picomatch` advisories from the production dependency graph.
- Fix generated-import assertions so `useChunk` cannot accidentally match `useChunkBy`.
- Add package metadata (`engines`, `homepage`, `bugs`), an MIT `LICENSE`, and package-artifact validation with `publint`.
- Modernize CI with frozen pnpm installs, lint/type/build/package checks, and supported Nuxt 3/Nuxt 4 runtime coverage.
- Correct README terminology and installation examples; document reproducibility and supported runtimes.

Acceptance: install, lint, unit/e2e tests, type checks, production playground build, `prepack`, `publint`, and production audit all pass.

## Phase 2 — v1.1.0 Import Controls

Make import registration deterministic without changing existing defaults.

- Extract a pure import-planning layer from Nuxt setup and register the resulting imports in one batch.
- Add a typed `include` allowlist so applications can register only the utilities they use.
- Type method-bearing options from the actual base/compat export surfaces while retaining forward-compatible strings.
- Fix `baseMethods` and `compatMethods` so they can select methods absent from the active default surface.
- Reject conflicting overrides, duplicate generated names, invalid JavaScript identifiers, and unknown explicitly included/overridden methods with actionable messages.
- Continue allowing exclusions and aliases, but report unknown entries as configuration warnings.
- Exclude class-like runtime exports such as `AbortError` and `TimeoutError` from broad defaults.
- Add focused unit tests for the planner plus Nuxt fixture regressions for allowlists, validation, aliases, and cross-surface overrides.

Acceptance: the public option types are documented, legacy fixtures stay green, and each fixed failure has a regression test.

## Phase 3 — v1.2.0 Opt-in Entrypoints

Expose useful non-root APIs without polluting the default global namespace.

- Add an `entrypoints` option for `es-toolkit/fp`, `es-toolkit/map`, and `es-toolkit/set`.
- Generate collision-resistant names such as `useFpMap`, `useMapFilter`, and `useSetMap`; apply the configured main prefix consistently.
- Keep these entrypoints disabled by default and compatible with `include`, `exclude`, and aliases through qualified method names.
- Do not auto-import `es-toolkit/types` because it has no runtime values.
- Defer `es-toolkit/server` until a separate server-only API has a proven Nuxt 3/4 implementation; never expose Node-only helpers to client auto-imports.
- Document data-last semantics for FP utilities and Map/Set-specific behavior to prevent accidental substitution for root utilities.

Acceptance: generated client imports reference only requested safe subpaths, naming is collision-free, and SSR fixture tests exercise every entrypoint.

## Phase 4 — v2.0.0 Semantics and Defaults

Use the major boundary for intentional behavior changes.

- Replace the hand-maintained compat-preferred barrel with a union-based resolver: `compat: 'prefer'` selects compat whenever that export exists and otherwise selects base.
- Make base `es-toolkit` behavior the default (`compat: false`); keep `compat: 'prefer'`, `compat: 'only'`, and per-method overrides explicit.
- Change the default prefix from collision-prone `use`/bare `is*` names to `et` for every import (`etChunk`, `etIsEqual`), with prefix skipping disabled by default.
- Remove obsolete runtime barrels and keep generated sources transparent in `imports.d.ts`.
- Add a v1-to-v2 migration guide with equivalent configuration for preserving legacy names and compat behavior.
- Update fixtures, examples, option docs, and tests to distinguish base and compat semantics.

Acceptance: all three compat modes select the documented source for every overlapping/non-overlapping export, and migration configuration reproduces v1 naming.

## Final Verification and Handoff

- Run the complete quality gate on the tip of every release branch where practical.
- Pack the module and inspect the tarball file list, size, exports, and type declarations from a clean consumer fixture.
- Smoke-test the packed module against the latest supported Nuxt 3 and Nuxt 4 releases on supported Node versions.
- Review `git diff`, branch ancestry, and commit history; leave only intentional tracked changes.
- Record completed/deferred items and exact verification commands in the final handoff. Publishing, release commits, tags, and remote operations remain the maintainer's follow-up.
