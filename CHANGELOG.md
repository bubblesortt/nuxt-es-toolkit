# Changelog

## v1.2.0

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.1.0...v1.2.0)

### Features

- Add opt-in auto-import surfaces for `es-toolkit/fp`, `es-toolkit/map`, and `es-toolkit/set`
- Generate collision-resistant names such as `useFpMap`, `useMapFilter`, and `useSetMap`
- Support qualified entrypoint methods in `include`, `exclude`, and aliases

### Validation

- Reject unknown entrypoints and report when an included method requires a disabled entrypoint
- Keep runtime-free `es-toolkit/types` and Node-only `es-toolkit/server` helpers out of client auto-imports

### Tests and Documentation

- Exercise all optional entrypoints through SSR fixtures and focused planner tests
- Document FP data-last signatures and Map/Set-specific behavior

## v1.1.0

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.12...v1.1.0)

### Features

- Add a typed `include` allowlist for registering only selected utilities
- Plan and register imports deterministically in a single batch
- Allow explicit base and compat selections across the active default surface

### Fixes

- Reject conflicting overrides, duplicate generated names, invalid identifiers, and unknown explicit selections
- Warn about unknown exclusions and aliases while preserving forward-compatible method names
- Exclude class-like error exports from broad default imports

### Tests and Documentation

- Cover allowlists, aliases, validation, and cross-surface overrides with unit and Nuxt fixture tests
- Document import controls, diagnostics, and public option types

## v1.0.12

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.11...v1.0.12)

### Fixes

- Update `es-toolkit` to 1.50.0 and refresh Nuxt runtime dependencies
- Resolve production dependency advisories and add package metadata

### Tests

- Match generated auto-import identifiers exactly
- Validate the package artifact with publint

### CI

- Add Nuxt 3 and Nuxt 4 compatibility coverage
- Run lint, tests, type checks, playground build, and package validation with frozen installs

### Documentation

- Add repository guidelines, an MIT license, and the local development roadmap
- Clarify installation, runtime requirements, and auto-import terminology

## v1.0.11

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.10...v1.0.11)

## v1.0.10

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.9...v1.0.10)

## v1.0.9

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.8...v1.0.9)

## v1.0.8

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.7...v1.0.8)

## v1.0.7

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.6...v1.0.7)

## v1.0.6

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.5...v1.0.6)

## v1.0.5

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.4...v1.0.5)

## v1.0.4

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.3...v1.0.4)

## v1.0.3

[compare changes](https://github.com/BubbleSortt/nuxt-es-toolkit/compare/v1.0.2...v1.0.3)

## v1.0.2

[compare changes](https://github.com/BubbleSortt/nuxt-estoolkit/compare/v1.0.1...v1.0.2)

## v1.0.1
