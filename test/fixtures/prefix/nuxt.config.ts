import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  esToolkit: {
    // A blank/whitespace prefix must disable the prefix (and uppercasing),
    // keeping each function's original name — not produce leading-space identifiers.
    prefix: ' ',
  },
})
