# Nuxt-es-toolkit

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
![Types][types-href]
![Nuxt 3.x | 4.x][nuxt-href]

## 🪄 About
A lightweight Nuxt 3 & 4 module that auto-imports functions from [es-toolkit](https://es-toolkit.dev) as Nuxt composables
with full TypeScript support.

---

## ✨ Features
- Auto-import `es-toolkit` functions
- Support custom prefix or no prefix at all
- Skip prefix automatically for predicate-like names (`isX`) via `prefixSkip`
- Alias any function with type-safe completions
- Exclude unwanted functions
- Generated `.d.ts` for IDE autocomplete
- Tree-shaking friendly (import only what you use)
- Zero runtime overhead (handled at build phase)
- Nuxt 3 & 4 compatible
- Clean and minimal configuration surface

---

## 📦 Install

Using nuxt cli
```bash
npx nuxt module add @bubblesortt/nuxt-es-toolki
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
  modules: ["@bubblesortt/nuxt-es-toolkit"],
});
```
3. Config it if you need:
```ts
export default defineNuxtConfig({
  modules: ["@bubblesortt/nuxt-es-toolkit"],
  esToolkit: {
    // your options here
  }
});
``` 
or
```ts
export default defineNuxtConfig({
  modules: [
    ["@bubblesortt/nuxt-es-toolkit",
      {
        // your options here
      },
    ],
  ],
});
```

---

## 🧪 Example

When you use  [Es-toolkit](https://es-toolkit.dev) utilities in your Nuxt application, they will be auto-imported

```vue
<script setup lang="ts">
  const text = useUpperFirst("hello");
</script>

<template>
  <div>{{ text }}</div>
</template>
```

---

## ⚙️ Config

| Name               | Default | Description                                                                           |
| ------------------ |---------|---------------------------------------------------------------------------------------|
| `prefix`           | `'use'` | String to prepend before each es-toolkit function (empty string to disable)           |
| `exclude`          | `[]`    | Array of es-toolkit functions to exclude from auto imports                            |
| `alias`            | `[]`    | Array of array pairs to rename specific es-toolkit functions (prefix is still added)  |
| `prefixSkip`       | `['is']`| Functions that starts with this keywords will be skipped by prefix (false to disable) |

---

## 💡 Config example 

```ts
export default defineNuxtConfig({
  modules: ["@bubblesortt/nuxt-es-toolkit"],
  esToolkit: {
    prefix: "use",
    prefixSkip: ["is"],
    exclude: ["map", "find"],
    alias: [
      ["sum", "total"], // => useTotal
      ["max", "maximum"], // => useMaximum
      ["isDate", "isExactlyDate"], // => isExactlyDate
    ],
  },
});
```

---

## 🧠 TypeScript & DX

- Auto-generated `.d.ts` lets your IDE know about added composables instantly (after first `nuxt dev` run).
- Works with both server & client usage transparently.
- Safe to use in strict TS setups.

---

## 🚀 Performance

- Zero additional runtime code: everything is resolved at compile time.
- Tree-shaking remains effective (only referenced functions are bundled) as long as `es-toolkit` provides proper ESM exports without side effects.
- No dynamic imports or proxies.

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
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
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
