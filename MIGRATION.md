# Migrating from v1 to v2

Version 2 uses safer, explicit defaults. Review these changes before upgrading and use the compatibility configuration below when migrating incrementally.

## Default Behavior

| Option | v1 default | v2 default |
| ------ | ---------- | ---------- |
| `compat` | `'prefer'` | `false` |
| `prefix` | `'use'` | `'et'` |
| `prefixSkip` | `['is']` | `false` |

Base `es-toolkit` is now the default source. Every generated name receives the collision-resistant `et` prefix: `useChunk` becomes `etChunk`, and bare `isEqual` becomes `etIsEqual`. Compat-only functions such as `add` are not registered unless compat is enabled.

## Preserve v1-style Names

Use explicit legacy naming while migrating call sites incrementally:

```ts
export default defineNuxtConfig({
  modules: ['@bubblesortt/nuxt-es-toolkit'],
  esToolkit: {
    compat: 'prefer',
    prefix: 'use',
    prefixSkip: ['is'],
  },
})
```

This preserves names such as `useChunk` and `isEqual` and follows the documented v1 compat policy.

## Compat Source Correction

In v1, the hand-maintained `'prefer'` barrel accidentally routed some overlapping functions—including `merge`, `omit`, `pick`, `sortBy`, `throttle`, and `uniq`—to base exports. Version 2 consistently imports an overlap from `es-toolkit/compat` and uses base only when compat does not export the name.

If application behavior depended on the old accidental base source, force that method explicitly:

```ts
export default defineNuxtConfig({
  esToolkit: {
    compat: 'prefer',
    baseMethods: ['merge', 'sortBy'],
  },
})
```

Alternatively, set `compat: false` to use only the base API. Use `compat: 'only'` (or `true`) for only Lodash-compatible exports.

## Migration Checklist

1. Run `pnpm dev:prepare` and inspect generated `.nuxt/imports.d.ts`.
2. Replace default `useX` and bare `isX` references with `etX` and `etIsX`, or temporarily apply the legacy naming configuration above.
3. Replace compat-only utilities or enable an explicit compat mode.
4. Verify overlapping functions whose base and compat signatures differ.
5. Run `pnpm test`, `pnpm test:types`, and a production Nuxt build before deploying.
