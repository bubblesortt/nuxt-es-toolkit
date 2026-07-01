import { defineNuxtModule, createResolver, addImports } from '@nuxt/kit'
import * as toolkitPrefer from './runtime/es-toolkit'
import * as toolkitCompatAll from './runtime/es-toolkit-compat-all'
import * as toolkitBase from './runtime/es-toolkit-base'
import { toArray, upperFirst } from './utils/module'

type ToolkitModule = Record<string, unknown>

export interface ModuleOptions {
  /**
   * Choose which es-toolkit export surface to auto-import
   *
   * - 'prefer': use compat exports when available, fall back to base exports
   * - 'only' or true: use compat exports only (Lodash-compatible)
   * - false: use base es-toolkit exports only
   *
   * @defaultValue 'prefer'
   */
  compat: 'prefer' | 'only' | boolean
  /**
   * Methods that should always be imported from es-toolkit/compat
   *
   * @defaultValue []
   * @example compatMethods: ['get', 'set']
   */
  compatMethods: string[]
  /**
   * Methods that should always be imported from es-toolkit base exports
   *
   * @defaultValue []
   * @example baseMethods: ['map', 'filter']
   */
  baseMethods: string[]
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
   * An empty string (or any blank/whitespace value) disables the prefix
   * and keeps each function's original casing.
   *
   * @defaultValue `use`
   * @example prefix: 'use'
   */
  prefix: string
  /**
   * Functions that starts with this keywords will be skipped by prefix
   *
   * Pass `false` or an empty array to disable prefix-skipping entirely, so every
   * function (including `is*`) receives the prefix.
   *
   * @defaultValue ['is']
   * @example prefixSkip: ['is', 'has']
   */
  prefixSkip?: string[] | false
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-es-toolkit',
    configKey: 'esToolkit',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    compat: 'prefer',
    compatMethods: [],
    baseMethods: [],
    exclude: [],
    alias: [],
    prefix: 'use',
    // `prefixSkip` is intentionally absent from `defaults`: Nuxt merges module
    // options with `defu`, which drops empty arrays and concatenates arrays with
    // the default. Declaring it here would break `prefixSkip: []` and surprise
    // users who pass their own list. The `['is']` default is applied in `setup`.
  },
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)
    let compatMode: 'prefer' | 'only' | false = 'prefer'
    if (_options.compat === true) {
      compatMode = 'only'
    }
    else if (typeof _options.compat !== 'undefined') {
      compatMode = _options.compat
    }

    let toolkit = toolkitPrefer as ToolkitModule
    if (compatMode === 'only') {
      toolkit = toolkitCompatAll as ToolkitModule
    }
    else if (compatMode === false) {
      toolkit = toolkitBase as ToolkitModule
    }
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
    const preferEntry = resolve('./runtime/es-toolkit')
    const compatEntry = resolve('./runtime/es-toolkit-compat-all')
    const baseEntry = resolve('./runtime/es-toolkit-base')
    let defaultEntry = preferEntry
    if (compatMode === 'only') {
      defaultEntry = compatEntry
    }
    else if (compatMode === false) {
      defaultEntry = baseEntry
    }
    const compatOnly = new Set(toArray(_options.compatMethods || []))
    const baseOnly = new Set(toArray(_options.baseMethods || []))
    const compatExports = new Set(Object.keys(toolkitCompatAll as ToolkitModule))
    const baseExports = new Set(Object.keys(toolkitBase as ToolkitModule))

    const prefixSkip = _options.prefixSkip === undefined
      ? ['is']
      : _options.prefixSkip === false
        ? []
        : toArray(_options.prefixSkip)
    const aliasMap = new Map<string, string>(_options.alias)
    const excludes = [..._options.exclude, ...excludeDefault]
    for (const name of Object.keys(toolkit)) {
      if (!excludes.includes(name)) {
        const alias = aliasMap.has(name) ? String(aliasMap.get(name)) : name
        const isSkipPrefix = prefixSkip.some(prefix => alias.startsWith(prefix))
        // A blank/whitespace prefix disables the prefix (and uppercasing),
        // keeping each function's original name. Trimming also guards against
        // accidental surrounding whitespace, which would produce invalid identifiers.
        const prefix = isSkipPrefix ? '' : (_options.prefix || '').trim()
        const as = prefix ? `${prefix}${upperFirst(alias)}` : alias
        let from = defaultEntry
        if (compatOnly.has(name) && compatExports.has(name)) {
          from = compatEntry
        }
        else if (baseOnly.has(name) && baseExports.has(name)) {
          from = baseEntry
        }
        addImports({ name, as, from })
      }
    }
  },
})
