export type CompatMode = 'prefer' | 'only' | false

export interface ToolkitModule {
  [name: string]: unknown
}

export interface ImportEntries {
  prefer: string
  compat: string
  base: string
}

export interface ImportSurfaces {
  prefer: ToolkitModule
  compat: ToolkitModule
  base: ToolkitModule
}

export interface PlannedImport {
  name: string
  as: string
  from: string
}

export interface PlanImportsOptions {
  compatMode: CompatMode
  surfaces: ImportSurfaces
  entries: ImportEntries
  compatMethods: readonly string[]
  baseMethods: readonly string[]
  include?: readonly string[]
  exclude: readonly string[]
  defaultExclude: readonly string[]
  alias: Iterable<readonly [string, string]>
  prefix: string
  prefixSkip: readonly string[]
  warn?: (message: string) => void
}

const reservedIdentifiers = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
])

const identifierPattern = /^[$_\p{ID_Start}][$\p{ID_Continue}]*$/u

const isValidIdentifier = (value: string) =>
  identifierPattern.test(value) && !reservedIdentifiers.has(value)

const unique = (values: Iterable<string>) => [...new Set(values)]

const configError = (message: string) => new Error(`[nuxt-es-toolkit] ${message}`)

const validateMethods = (
  methods: readonly string[],
  exports: Set<string>,
  option: 'baseMethods' | 'compatMethods',
) => {
  for (const method of methods) {
    if (!exports.has(method)) {
      const entry = option === 'baseMethods' ? 'es-toolkit' : 'es-toolkit/compat'
      throw configError(`Unknown ${option} entry "${method}"; it is not exported by ${entry}.`)
    }
  }
}

export const planImports = (options: PlanImportsOptions): PlannedImport[] => {
  const baseExports = new Set(Object.keys(options.surfaces.base))
  const compatExports = new Set(Object.keys(options.surfaces.compat))
  const availableExports = new Set([...baseExports, ...compatExports])
  const compatMethods = new Set(options.compatMethods)
  const baseMethods = new Set(options.baseMethods)

  validateMethods(options.compatMethods, compatExports, 'compatMethods')
  validateMethods(options.baseMethods, baseExports, 'baseMethods')

  for (const method of compatMethods) {
    if (baseMethods.has(method)) {
      throw configError(`Method "${method}" cannot appear in both compatMethods and baseMethods.`)
    }
  }

  const defaultSurface = options.compatMode === 'only'
    ? options.surfaces.compat
    : options.compatMode === false
      ? options.surfaces.base
      : options.surfaces.prefer
  const defaultEntry = options.compatMode === 'only'
    ? options.entries.compat
    : options.compatMode === false
      ? options.entries.base
      : options.entries.prefer
  const defaultExports = new Set(Object.keys(defaultSurface))

  let methods: string[]
  if (options.include === undefined) {
    methods = unique([...defaultExports, ...compatMethods, ...baseMethods])
  }
  else {
    methods = unique(options.include)
    for (const method of methods) {
      if (!availableExports.has(method)) {
        throw configError(`Unknown include entry "${method}"; it is not exported by es-toolkit.`)
      }
      if (!defaultExports.has(method) && !compatMethods.has(method) && !baseMethods.has(method)) {
        throw configError(`Included method "${method}" is not available in the selected compat mode; add a per-method override.`)
      }
    }
  }

  for (const method of options.exclude) {
    if (!availableExports.has(method)) {
      options.warn?.(`Unknown exclude entry "${method}"; it will be ignored.`)
    }
  }

  const aliasEntries = [...options.alias]
  for (const [method] of aliasEntries) {
    if (!availableExports.has(method)) {
      options.warn?.(`Unknown alias source "${method}"; it will be ignored.`)
    }
  }

  const aliasMap = new Map(aliasEntries)
  const excludes = new Set(options.exclude)
  if (options.include === undefined) {
    for (const method of options.defaultExclude) {
      excludes.add(method)
    }
  }

  const prefix = options.prefix.trim()
  const generatedNames = new Map<string, string>()
  const imports: PlannedImport[] = []

  for (const name of methods) {
    if (excludes.has(name)) {
      continue
    }

    const alias = aliasMap.get(name) ?? name
    const skipPrefix = options.prefixSkip.some(value => alias.startsWith(value))
    const as = !prefix || skipPrefix
      ? alias
      : `${prefix}${alias[0]?.toUpperCase() ?? ''}${alias.slice(1)}`

    if (!isValidIdentifier(as)) {
      throw configError(`Generated import name "${as}" for "${name}" is not a valid JavaScript identifier.`)
    }

    const duplicate = generatedNames.get(as)
    if (duplicate) {
      throw configError(`Methods "${duplicate}" and "${name}" both generate the import name "${as}".`)
    }
    generatedNames.set(as, name)

    let from = defaultEntry
    if (compatMethods.has(name)) {
      from = options.entries.compat
    }
    else if (baseMethods.has(name)) {
      from = options.entries.base
    }

    imports.push({ name, as, from })
  }

  return imports
}
