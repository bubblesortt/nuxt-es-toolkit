import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  esToolkit: {
    // `false` is documented as a way to disable prefix-skipping.
    // It must be accepted by the option type and disable skipping at runtime.
    prefixSkip: false,
  },
})
