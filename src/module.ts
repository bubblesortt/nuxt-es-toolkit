import { defineNuxtModule, createResolver, addImports } from '@nuxt/kit'

import * as toolkit from './runtime/es-toolkit'

export interface ModuleOptions {
  /**
   * Array of es-toolkit functions to be excluded from auto imports
   *
   * @defaultValue []
   * @example exclude: ['sum', 'max']
   */
  exclude: string[]
  /**
   * Iterable of string pairs to alias each function
   *
   * @defaultValue []
   * @example alias: [['sum', 'total'], ['max', 'maximum']]
   */
  alias: Iterable<[string, string]>
  /**
   * Prefix to be added before every es-toolkit function
   *
   * `' '` to disable uppercasing
   *
   * @defaultValue `use`
   * @example prefix: 'use'
   */
  prefix: string
  /**
   * Functions that starts with this keywords will be skipped by prefix
   *
   * @defaultValue ['is']
   * @example prefixSkip: ['is', 'has']
   */
  prefixSkip: string[]
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-estoolkit',
    configKey: 'esToolkit',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    exclude: [],
    alias: [],
    prefix: 'use',
    prefixSkip: ['is'],
  },
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const { forEach, castArray, includes, startsWith, upperFirst, join, some, keys } = toolkit
    const excludeDefault = [
      'wrapperValue',
      'wrapperToIterator',
      'wrapperReverse',
      'wrapperPlant',
      'wrapperNext',
      'wrapperLodash',
      'wrapperCommit',
      'wrapperChain',
      'wrapperAt',
      'templateSettings',
      'toIterator',
      'VERSION',
      'lodash',
      'value',
      'valueOf',
      'toJSON',
      'thru',
      'plant',
      'next',
      'default',
      'commit',
      'head',
      'Mutex',
      'Semaphore',
    ]

    const prefixSkip = castArray(_options.prefixSkip || [])
    const aliasMap = new Map<string, string>(_options.alias)
    const excludes = [..._options.exclude, ...excludeDefault]
    forEach(keys(toolkit), (name) => {
      if (!includes(excludes, name)) {
        const alias = aliasMap.has(name) ? String(aliasMap.get(name)) : name
        const isSkipPrefix = some(prefixSkip, prefix => startsWith(alias, prefix))
        const prefix = isSkipPrefix ? '' : _options.prefix || ''
        const as = prefix ? join([prefix, upperFirst(alias)], '') : alias
        addImports({ name, as, from: resolve('./runtime/es-toolkit') })
      }
    })
  },
})
