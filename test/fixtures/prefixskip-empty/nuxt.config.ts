import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  esToolkit: {
    // User wants to DISABLE prefix-skipping so predicate names also get the prefix.
    prefixSkip: [],
  },
})
