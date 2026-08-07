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

export interface EntrypointSurface {
  name: string
  enabled: boolean
  exports: ToolkitModule
  entry: string
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
  entrypoints?: readonly EntrypointSurface[]
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

const upperFirst = (value: string) =>
  `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`

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

  interface ImportCandidate {
    key: string
    name: string
    defaultAlias: string
    from: string
  }

  const candidates = new Map<string, ImportCandidate>()
  for (const name of defaultExports) {
    candidates.set(name, { key: name, name, defaultAlias: name, from: defaultEntry })
  }
  for (const name of compatMethods) {
    candidates.set(name, { key: name, name, defaultAlias: name, from: options.entries.compat })
  }
  for (const name of baseMethods) {
    candidates.set(name, { key: name, name, defaultAlias: name, from: options.entries.base })
  }

  const knownQualifiedMethods = new Map<string, string>()
  const entrypointNames = new Set<string>()
  for (const entrypoint of options.entrypoints ?? []) {
    if (entrypointNames.has(entrypoint.name)) {
      throw configError(`Entrypoint "${entrypoint.name}" is configured more than once.`)
    }
    entrypointNames.add(entrypoint.name)

    for (const name of Object.keys(entrypoint.exports)) {
      const key = `${entrypoint.name}.${name}`
      knownQualifiedMethods.set(key, entrypoint.name)
      if (entrypoint.enabled) {
        candidates.set(key, {
          key,
          name,
          defaultAlias: `${entrypoint.name}${upperFirst(name)}`,
          from: entrypoint.entry,
        })
      }
    }
  }

  let selectedCandidates: ImportCandidate[]
  if (options.include === undefined) {
    selectedCandidates = [...candidates.values()]
  }
  else {
    selectedCandidates = unique(options.include).map((method) => {
      const candidate = candidates.get(method)
      if (candidate) {
        return candidate
      }
      const entrypoint = knownQualifiedMethods.get(method)
      if (entrypoint) {
        throw configError(`Included method "${method}" requires the "${entrypoint}" entrypoint to be enabled.`)
      }
      if (availableExports.has(method)) {
        throw configError(`Included method "${method}" is not available in the selected compat mode; add a per-method override.`)
      }
      throw configError(`Unknown include entry "${method}"; it is not exported by es-toolkit.`)
    })
  }

  const knownMethods = new Set([...availableExports, ...knownQualifiedMethods.keys()])

  for (const method of options.exclude) {
    if (!knownMethods.has(method)) {
      options.warn?.(`Unknown exclude entry "${method}"; it will be ignored.`)
    }
  }

  const aliasEntries = [...options.alias]
  for (const [method] of aliasEntries) {
    if (!knownMethods.has(method)) {
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

  for (const candidate of selectedCandidates) {
    if (excludes.has(candidate.key)) {
      continue
    }

    const alias = aliasMap.get(candidate.key) ?? candidate.defaultAlias
    const skipPrefix = options.prefixSkip.some(value => alias.startsWith(value))
    const as = !prefix || skipPrefix
      ? alias
      : `${prefix}${upperFirst(alias)}`

    if (!isValidIdentifier(as)) {
      throw configError(`Generated import name "${as}" for "${candidate.key}" is not a valid JavaScript identifier.`)
    }

    const duplicate = generatedNames.get(as)
    if (duplicate) {
      throw configError(`Methods "${duplicate}" and "${candidate.key}" both generate the import name "${as}".`)
    }
    generatedNames.set(as, candidate.key)

    imports.push({ name: candidate.name, as, from: candidate.from })
  }

  return imports
}
