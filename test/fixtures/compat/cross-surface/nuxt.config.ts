import MyModule from '../../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  esToolkit: {
    compat: 'only',
    baseMethods: ['isNotNil'],
  },
})
