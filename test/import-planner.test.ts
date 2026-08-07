import { describe, expect, it, vi } from 'vitest'
import { planImports, type PlanImportsOptions } from '../src/utils/imports'

const base = {
  chunk: () => {},
  head: () => {},
  isNotNil: () => {},
}
const compat = {
  add: () => {},
  chunk: () => {},
}
const fp = {
  map: () => {},
}
const map = {
  filter: () => {},
}

const createOptions = (overrides: Partial<PlanImportsOptions> = {}): PlanImportsOptions => ({
  compatMode: 'prefer',
  surfaces: {
    prefer: { ...base, add: compat.add },
    compat,
    base,
  },
  entries: {
    prefer: '/prefer',
    compat: '/compat',
    base: '/base',
  },
  compatMethods: [],
  baseMethods: [],
  exclude: [],
  defaultExclude: ['head'],
  alias: [],
  prefix: 'use',
  prefixSkip: ['is'],
  ...overrides,
})

describe('import planner', () => {
  it('limits registration to included methods', () => {
    expect(planImports(createOptions({ include: ['chunk'] }))).toEqual([
      { name: 'chunk', as: 'useChunk', from: '/prefer' },
    ])
    expect(planImports(createOptions({ include: [] }))).toEqual([])
  })

  it('allows include to opt into a broad default exclusion', () => {
    expect(planImports(createOptions({ include: ['head'] }))).toEqual([
      { name: 'head', as: 'useHead', from: '/prefer' },
    ])
  })

  it('adds a forced base method in compat-only mode', () => {
    const imports = planImports(createOptions({
      compatMode: 'only',
      baseMethods: ['isNotNil'],
    }))

    expect(imports).toContainEqual({ name: 'isNotNil', as: 'isNotNil', from: '/base' })
  })

  it('adds a forced compat method in base mode', () => {
    const imports = planImports(createOptions({
      compatMode: false,
      compatMethods: ['add'],
    }))

    expect(imports).toContainEqual({ name: 'add', as: 'useAdd', from: '/compat' })
  })

  it('rejects conflicting and unknown source overrides', () => {
    expect(() => planImports(createOptions({
      compatMethods: ['chunk'],
      baseMethods: ['chunk'],
    }))).toThrow('both compatMethods and baseMethods')
    expect(() => planImports(createOptions({ baseMethods: ['missing'] })))
      .toThrow('Unknown baseMethods entry "missing"')
  })

  it('rejects unknown or unavailable included methods', () => {
    expect(() => planImports(createOptions({ include: ['missing'] })))
      .toThrow('Unknown include entry "missing"')
    expect(() => planImports(createOptions({ compatMode: 'only', include: ['isNotNil'] })))
      .toThrow('not available in the selected compat mode')
  })

  it('rejects invalid and duplicate generated names', () => {
    expect(() => planImports(createOptions({
      include: ['chunk'],
      alias: [['chunk', 'not-valid']],
    }))).toThrow('not a valid JavaScript identifier')
    expect(() => planImports(createOptions({
      include: ['add', 'chunk'],
      alias: [['add', 'same'], ['chunk', 'same']],
    }))).toThrow('both generate the import name "useSame"')
  })

  it('warns about unknown exclusions and alias sources', () => {
    const warn = vi.fn()
    planImports(createOptions({
      exclude: ['missing-exclude'],
      alias: [['missing-alias', 'unused']],
      warn,
    }))

    expect(warn).toHaveBeenCalledWith('Unknown exclude entry "missing-exclude"; it will be ignored.')
    expect(warn).toHaveBeenCalledWith('Unknown alias source "missing-alias"; it will be ignored.')
  })

  it('plans enabled entrypoints with qualified names', () => {
    const imports = planImports(createOptions({
      entrypoints: [
        { name: 'fp', enabled: true, exports: fp, entry: '/fp' },
        { name: 'map', enabled: true, exports: map, entry: '/map' },
      ],
      include: ['fp.map', 'map.filter'],
    }))

    expect(imports).toEqual([
      { name: 'map', as: 'useFpMap', from: '/fp' },
      { name: 'filter', as: 'useMapFilter', from: '/map' },
    ])
  })

  it('applies qualified aliases and exclusions', () => {
    const imports = planImports(createOptions({
      entrypoints: [
        { name: 'fp', enabled: true, exports: fp, entry: '/fp' },
        { name: 'map', enabled: true, exports: map, entry: '/map' },
      ],
      exclude: ['map.filter'],
      alias: [['fp.map', 'functionalMap']],
    }))

    expect(imports).toContainEqual({ name: 'map', as: 'useFunctionalMap', from: '/fp' })
    expect(imports).not.toContainEqual(expect.objectContaining({ from: '/map' }))
  })

  it('rejects included methods from disabled entrypoints', () => {
    expect(() => planImports(createOptions({
      entrypoints: [{ name: 'fp', enabled: false, exports: fp, entry: '/fp' }],
      include: ['fp.map'],
    }))).toThrow('requires the "fp" entrypoint to be enabled')
  })
})
