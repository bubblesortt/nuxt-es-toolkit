import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  esToolkit: {
    compat: 'prefer',
    prefix: 'use',
    prefixSkip: ['is'],
    exclude: ['sum', 'map'],
    alias: [
      ['max', 'maximum'],
    ],
  },
})
