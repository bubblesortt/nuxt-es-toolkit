import MyModule from '../../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  esToolkit: {
    compat: 'prefer',
    compatMethods: ['chunk'],
    baseMethods: ['compact'],
  },
})
