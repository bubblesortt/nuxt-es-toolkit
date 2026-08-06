# Nuxt-es-toolkit

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
![Types][types-href]
![Nuxt 3.x | 4.x][nuxt-href]

## 🪄 About

A lightweight Nuxt 3 & 4 module that auto-imports utilities from [es-toolkit](https://es-toolkit.dev)
with full TypeScript support.

---

## ✨ Features

- Auto-import `es-toolkit` functions
- Support custom prefix or no prefix at all
- Skip prefix automatically for predicate-like names (`isX`) via `prefixSkip`
- Alias any function with type-safe completions
- Limit registration to an explicit `include` allowlist
- Opt into qualified FP, Map, and Set helpers without name collisions
- Exclude unwanted functions
- Generated `.d.ts` for IDE autocomplete
- Tree-shaking friendly (import only what you use)
- No runtime wrapper (imports are generated during Nuxt setup)
- Nuxt 3 & 4 compatible
- Clean and minimal configuration surface

---

## 📦 Install

Using the Nuxt CLI:

```bash
npx nuxt module add --dev @bubblesortt/nuxt-es-toolkit
```

or manual

1. Install `@bubblesortt/nuxt-es-toolkit` as development dependency:

Using npm:
```bash
npm i -D @bubblesortt/nuxt-es-toolkit
```

Using pnpm:
```bash
pnpm add -D @bubblesortt/nuxt-es-toolkit
```

Using bun:
```bash
bun add -d @bubblesortt/nuxt-es-toolkit
```

2. Add it to the `modules` section of your `nuxt.config`:

```ts
export default defineNuxtConfig({
  modules: ['@bubblesortt/nuxt-es-toolkit'],
})
```

3. Configure it if needed:

```ts
export default defineNuxtConfig({
  modules: ['@bubblesortt/nuxt-es-toolkit'],
  esToolkit: {
    // your options here
  },
})
```

Or pass options inline:

```ts
export default defineNuxtConfig({
  modules: [
    [
      '@bubblesortt/nuxt-es-toolkit',
      {
        // your options here
      },
    ],
  ],
})
```

---

## 🧪 Example

When you use [es-toolkit](https://es-toolkit.dev) utilities in your Nuxt application, they are auto-imported:

```vue
<script setup lang="ts">
const text = etUpperFirst('hello')
</script>

<template>
  <div>{{ text }}</div>
</template>
```

---

## ⚙️ Config

| Name               | Default    | Description                                                                           |
| ------------------ |------------|---------------------------------------------------------------------------------------|
| `compat`           | `false`    | `'prefer'` = compat when available, `'only'`/`true` = compat only, `false` = base only |
| `compatMethods`    | `[]`       | Methods to force import from `es-toolkit/compat`                                      |
| `baseMethods`      | `[]`       | Methods to force import from base `es-toolkit`                                        |
| `entrypoints`      | `[]`       | Optional `fp`, `map`, and `set` export surfaces                                       |
| `include`          | `undefined` | Optional allowlist of methods to register (`[]` registers none)                       |
| `prefix`           | `'et'`     | String to prepend before each es-toolkit function (empty string to disable)           |
| `exclude`          | `[]`       | Array of es-toolkit functions to exclude from auto imports                            |
| `alias`            | `[]`       | Array of array pairs to rename specific es-toolkit functions (prefix is still added)  |
| `prefixSkip`       | `false`    | Name starts that skip the prefix (`false` or `[]` prefixes every utility)              |

---

## 💡 Config example 

```ts
export default defineNuxtConfig({
  modules: ['@bubblesortt/nuxt-es-toolkit'],
  esToolkit: {
    compat: 'only',
    compatMethods: ['get'],
    baseMethods: ['map'],
    prefix: 'use',
    prefixSkip: ['is'],
    exclude: ['map', 'find'],
    alias: [
      ['sum', 'total'], // => useTotal
      ['max', 'maximum'], // => useMaximum
      ['isDate', 'isExactlyDate'], // => isExactlyDate
    ],
  },
})
```

For a smaller global surface, use an allowlist:

```ts
export default defineNuxtConfig({
  modules: ['@bubblesortt/nuxt-es-toolkit'],
  esToolkit: {
    include: ['chunk', 'isNotNil', 'sum'],
  },
})
```

When `include` is present, per-method overrides must also appear in the allowlist. Explicitly included methods may opt into exports normally omitted from broad registration. Invalid included methods, conflicting source overrides, invalid aliases, and duplicate generated names stop setup with an actionable error; unknown `exclude` and alias sources produce warnings.

## Optional entrypoints

Non-root APIs are disabled by default. Enable only the surfaces your application needs:

```ts
export default defineNuxtConfig({
  modules: ['@bubblesortt/nuxt-es-toolkit'],
  esToolkit: {
    entrypoints: ['fp', 'map', 'set'],
    include: ['fp.map', 'map.filter', 'set.map'],
  },
})
```

Qualified configuration names become collision-resistant auto-imports:

| Configuration name | Auto-import     | Source             |
| ------------------ | --------------- | ------------------ |
| `fp.map`           | `etFpMap`       | `es-toolkit/fp`    |
| `map.filter`       | `etMapFilter`   | `es-toolkit/map`   |
| `set.map`          | `etSetMap`      | `es-toolkit/set`   |

Aliases and exclusions also use qualified names, such as `alias: [['fp.map', 'functionalMap']]` and `exclude: ['set.map']`. FP helpers use data-last signatures; Map and Set helpers operate on their respective collection types. `es-toolkit/types` has no runtime exports, and Node-only `es-toolkit/server` helpers are intentionally not registered as client auto-imports.

---

## 🧠 TypeScript & DX

- Auto-generated `.d.ts` lets your IDE know about added utilities after the first `nuxt dev` run.
- Works with both server & client usage transparently.
- Safe to use in strict TS setups.

---

## 🚀 Performance

- No module-specific runtime wrapper: Nuxt resolves direct `es-toolkit` imports during setup.
- Tree-shaking remains effective (only referenced functions are bundled) as long as `es-toolkit` provides proper ESM exports without side effects.
- No dynamic imports or proxies.

## ✅ Compatibility

CI verifies the module against Nuxt 3.21 on Node 20 and Nuxt 4.5 on Node 24. The package supports Node `^20.19.0 || >=22.12.0`; each Nuxt major may impose a narrower Node range.

Upgrading from v1 changes import sources and generated names. Follow the [v2 migration guide](./MIGRATION.md) before upgrading.

---

## 🔗 Related

- [es-toolkit Documentation](https://es-toolkit.dev)
- [Nuxt Modules Documentation](https://nuxt.com/modules)

---

## 🤝 Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  corepack enable
  pnpm install --frozen-lockfile
  
  # Generate type stubs
  pnpm dev:prepare
  
  # Develop with the playground
  pnpm dev
  
  # Build the playground
  pnpm dev:build
  
  # Run all quality checks
  pnpm check
  ```

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/%40bubblesortt%2Fnuxt-es-toolkit?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://www.npmjs.com/package/@bubblesortt/nuxt-es-toolkit

[npm-downloads-src]: https://img.shields.io/npm/dm/%40bubblesortt%2Fnuxt-es-toolkit?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://www.npmjs.com/package/@bubblesortt/nuxt-es-toolkit

[license-src]: https://img.shields.io/npm/l/%40bubblesortt%2Fnuxt-es-toolkit?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://www.npmjs.com/package/@bubblesortt/nuxt-es-toolkit

[types-href]: https://img.shields.io/badge/types-TypeScript-3178C6?style=flat&colorA=020420&colorB=3178C6
[nuxt-href]: https://img.shields.io/badge/Nuxt-3.x%20%7C%204.x-00DC82?logo=nuxt.js&logoColor=white
