import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  esToolkit: {
    entrypoints: ['fp', 'map', 'set'],
    include: ['fp.map', 'map.filter', 'set.map'],
  },
})
