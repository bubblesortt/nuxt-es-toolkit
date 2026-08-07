import { defineNuxtModule, createResolver, addImports, useLogger } from '@nuxt/kit'
import * as toolkitPrefer from './runtime/es-toolkit'
import * as toolkitCompatAll from './runtime/es-toolkit-compat-all'
import * as toolkitBase from './runtime/es-toolkit-base'
import * as toolkitFp from './runtime/es-toolkit-fp'
import * as toolkitMap from './runtime/es-toolkit-map'
import * as toolkitSet from './runtime/es-toolkit-set'
import { toArray } from './utils/module'
import { planImports, type CompatMode } from './utils/imports'

type LiteralUnion<T extends string> = T | (string & Record<never, never>)
type KnownBaseMethod = Extract<keyof typeof toolkitBase, string>
type KnownCompatMethod = Extract<keyof typeof toolkitCompatAll, string>
type KnownFpMethod = Extract<keyof typeof toolkitFp, string>
type KnownMapMethod = Extract<keyof typeof toolkitMap, string>
type KnownSetMethod = Extract<keyof typeof toolkitSet, string>
type KnownQualifiedMethod
  = | `fp.${KnownFpMethod}`
    | `map.${KnownMapMethod}`
    | `set.${KnownSetMethod}`

export type BaseToolkitMethod = LiteralUnion<KnownBaseMethod>
export type CompatToolkitMethod = LiteralUnion<KnownCompatMethod>
export type ToolkitMethod = LiteralUnion<KnownBaseMethod | KnownCompatMethod | KnownQualifiedMethod>
export type ToolkitEntrypoint = 'fp' | 'map' | 'set'

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
  compatMethods: CompatToolkitMethod[]
  /**
   * Methods that should always be imported from es-toolkit base exports
   *
   * @defaultValue []
   * @example baseMethods: ['map', 'filter']
   */
  baseMethods: BaseToolkitMethod[]
  /**
   * Additional es-toolkit entrypoints to auto-import with qualified names
   *
   * @defaultValue []
   * @example entrypoints: ['fp', 'map', 'set']
   */
  entrypoints?: ToolkitEntrypoint[]
  /**
   * Register only these es-toolkit methods
   *
   * An empty array disables all broad auto-imports. Per-method source overrides
   * still need to be listed here when an allowlist is present.
   *
   * @example include: ['chunk', 'isNotNil']
   */
  include?: ToolkitMethod[]
  /**
   * Array of es-toolkit functions to be excluded from auto imports
   *
   * @defaultValue []
   * @example exclude: ['sum', 'max']
   */
  exclude: ToolkitMethod[]
  /**
   * Iterable of string pairs to alias each function
   *
   * @defaultValue []
   * @example alias: [['sum', 'total'], ['max', 'maximum']]
   */
  alias: Iterable<readonly [ToolkitMethod, string]>
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
    let compatMode: CompatMode = 'prefer'
    if (_options.compat === true) {
      compatMode = 'only'
    }
    else if (typeof _options.compat !== 'undefined') {
      compatMode = _options.compat
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
      'AbortError',
      'TimeoutError',
    ]
    const preferEntry = resolve('./runtime/es-toolkit')
    const compatEntry = resolve('./runtime/es-toolkit-compat-all')
    const baseEntry = resolve('./runtime/es-toolkit-base')
    const fpEntry = resolve('./runtime/es-toolkit-fp')
    const mapEntry = resolve('./runtime/es-toolkit-map')
    const setEntry = resolve('./runtime/es-toolkit-set')
    const entrypoints = new Set(toArray(_options.entrypoints || []))
    for (const entrypoint of entrypoints) {
      if (entrypoint !== 'fp' && entrypoint !== 'map' && entrypoint !== 'set') {
        throw new Error(`[nuxt-es-toolkit] Unknown entrypoint "${entrypoint}". Expected "fp", "map", or "set".`)
      }
    }
    const prefixSkip = _options.prefixSkip === undefined
      ? ['is']
      : _options.prefixSkip === false
        ? []
        : toArray(_options.prefixSkip)
    const logger = useLogger('nuxt-es-toolkit')
    const imports = planImports({
      compatMode,
      surfaces: {
        prefer: toolkitPrefer,
        compat: toolkitCompatAll,
        base: toolkitBase,
      },
      entries: {
        prefer: preferEntry,
        compat: compatEntry,
        base: baseEntry,
      },
      entrypoints: [
        { name: 'fp', enabled: entrypoints.has('fp'), exports: toolkitFp, entry: fpEntry },
        { name: 'map', enabled: entrypoints.has('map'), exports: toolkitMap, entry: mapEntry },
        { name: 'set', enabled: entrypoints.has('set'), exports: toolkitSet, entry: setEntry },
      ],
      compatMethods: toArray(_options.compatMethods || []),
      baseMethods: toArray(_options.baseMethods || []),
      include: _options.include === undefined ? undefined : toArray(_options.include),
      exclude: toArray(_options.exclude || []),
      defaultExclude: excludeDefault,
      alias: _options.alias,
      prefix: _options.prefix || '',
      prefixSkip,
      warn: message => logger.warn(message),
    })

    addImports(imports)
  },
})
