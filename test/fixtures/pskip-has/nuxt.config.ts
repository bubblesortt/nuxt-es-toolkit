import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  esToolkit: { prefixSkip: ['has'] },
})
