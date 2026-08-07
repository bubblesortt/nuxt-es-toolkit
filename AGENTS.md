# Repository Guidelines

## Project Structure & Module Organization

`src/module.ts` defines the Nuxt module and its public options. `src/utils/imports.ts` plans and validates auto-imports independently of Nuxt. `src/runtime/` contains base, compat, FP, Map, and Set export barrels; update them deliberately when changing import resolution. Shared helpers live in `src/utils/`.

Use `playground/` as the local Nuxt application for manual verification. Automated tests live in `test/`, with minimal Nuxt apps under `test/fixtures/` and shared assertions in `test/utils/`. Generated directories such as `dist/`, `.nuxt/`, and `.output/` are ignored and must not be committed.

## Build, Test, and Development Commands

This project tests supported Node 20 and 24 releases in CI and pins pnpm 10 (see `packageManager`). Enable Corepack, then run `pnpm install --frozen-lockfile`.

- `pnpm dev:prepare`: build module stubs and prepare Nuxt types; run before development or tests.
- `pnpm dev`: prepare the module, then start the playground.
- `pnpm dev:build`: build the playground as a production check.
- `pnpm lint`: run the Nuxt ESLint flat configuration.
- `pnpm test`: run the Vitest suite once; `pnpm test:watch` watches locally.
- `pnpm test:types`: type-check both the module and playground.
- `pnpm prepack`: create the publishable module in `dist/`.
- `pnpm test:package`: validate the built package with publint.

Run one test with `pnpm vitest run test/options.test.ts` or filter by name with `pnpm vitest run -t "renders the index page"`.

## Coding Style & Naming Conventions

Write TypeScript/ES modules with two-space indentation, LF endings, single quotes, and no semicolons, matching the existing Nuxt ESLint style. Use `camelCase` for variables/functions, `PascalCase` for types, and kebab-case for fixture directories. Keep module options documented with TSDoc and prefer small helpers in `src/utils/` over expanding setup logic.

## Testing Guidelines

Tests use Vitest with `@nuxt/test-utils/e2e`. Name files `*.test.ts` and pair configuration behavior with a focused fixture. Use SSR `$fetch` assertions for runtime output and inspect generated `imports.d.ts` for aliases, prefixes, exclusions, and runtime-source selection. No coverage threshold is configured; every behavior change should include a regression test. Before submitting, run `pnpm dev:prepare`, `pnpm lint`, `pnpm test`, and `pnpm test:types`.

## Commit & Pull Request Guidelines

Legacy history uses `[main]` prefixes, while new work should follow Conventional Commits (for example, `fix: resolve forced base imports`). Automated releases use `chore(release): vX.Y.Z`. Keep commits narrowly scoped. Pull requests should explain the user-visible change, list validation commands, link relevant issues, and include playground screenshots only for UI-facing changes. Call out compatibility or generated-import changes explicitly.
