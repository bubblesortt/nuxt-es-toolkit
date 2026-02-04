import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  esToolkit: {
    prefix: 'use',
    prefixSkip: ['is'],
    exclude: ['sum', 'map'],
    alias: [
      ['max', 'maximum'],
    ],
  },
})
