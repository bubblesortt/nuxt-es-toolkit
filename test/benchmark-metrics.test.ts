import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import {
  evaluateV21Gates,
  measureBundleDirectory,
  normalizeToolkitImports,
  summarize,
} from '../bench/metrics.mjs'
import { compare, parseCompareArgs } from '../bench/compare.mjs'
import * as benchmarkRunner from '../bench/run.mjs'

const initialExitCode = process.exitCode
const benchmarkDirectory = mkdtempSync(join(tmpdir(), 'nuxt-es-toolkit-benchmarks-'))
let benchmarkIndex = 0

const createBenchmark = (candidate = false) => ({
  schemaVersion: 1,
  label: candidate ? 'candidate' : 'baseline',
  environment: {
    gitSha: candidate ? 'candidate-sha' : 'baseline-sha',
    platform: 'darwin',
    architecture: 'arm64',
    node: 'v24.14.0',
    pnpm: '10.34.5',
    nuxt: '4.5.2',
    module: candidate ? '2.1.0' : '2.0.0',
    esToolkit: '1.50.0',
  },
  moduleLoad: {
    incrementalMs: { median: candidate ? 25 : 100 },
    incrementalRssMiB: { median: candidate ? 9 : 20 },
  },
  imports: Array.from({ length: 185 }, (_, index) => ({
    name: `method${index}`,
    as: `etMethod${index}`,
    source: 'es-toolkit-base',
  })),
  bundles: {
    client: { files: 2, rawBytes: candidate ? 1005 : 1000, gzipBytes: 500 },
    server: { files: 2, rawBytes: candidate ? 2010 : 2000, gzipBytes: 1000 },
  },
})

const writeBenchmarkPair = (
  mutate: (baseline: ReturnType<typeof createBenchmark>, candidate: ReturnType<typeof createBenchmark>) => void,
) => {
  const baseline = createBenchmark()
  const candidate = createBenchmark(true)
  mutate(baseline, candidate)
  benchmarkIndex += 1
  const baselinePath = join(benchmarkDirectory, `${benchmarkIndex}-baseline.json`)
  const candidatePath = join(benchmarkDirectory, `${benchmarkIndex}-candidate.json`)
  writeFileSync(baselinePath, `${JSON.stringify(baseline)}\n`)
  writeFileSync(candidatePath, `${JSON.stringify(candidate)}\n`)
  return { baseline: baselinePath, candidate: candidatePath, profile: 'v2.1' }
}

const expectInvalidComparison = (
  mutate: (baseline: ReturnType<typeof createBenchmark>, candidate: ReturnType<typeof createBenchmark>) => void,
  field: string,
) => {
  expect(() => compare(writeBenchmarkPair(mutate))).toThrow(field)
}

afterEach(() => {
  process.exitCode = initialExitCode
})

afterAll(() => rmSync(benchmarkDirectory, { recursive: true, force: true }))

describe('benchmark metrics', () => {
  it('calculates stable median and p95 values', () => {
    expect(summarize([9, 1, 5, 3, 7])).toEqual({
      min: 1,
      max: 9,
      median: 5,
      p95: 9,
    })
  })

  it('normalizes toolkit imports without absolute paths', () => {
    const declaration = [
      'export { chunk as etChunk, sum as etSum } from \'/repo/dist/runtime/es-toolkit-base\';',
      'export { add as etAdd } from \'C:/repo/dist/runtime/es-toolkit-compat-all\';',
    ].join('\n')

    expect(normalizeToolkitImports(declaration)).toEqual([
      { name: 'chunk', as: 'etChunk', source: 'es-toolkit-base' },
      { name: 'sum', as: 'etSum', source: 'es-toolkit-base' },
      { name: 'add', as: 'etAdd', source: 'es-toolkit-compat-all' },
    ])
  })

  it('enforces v2.1 performance and bundle gates', () => {
    const baseline = {
      moduleLoad: { incrementalMs: { median: 100 }, incrementalRssMiB: { median: 20 } },
      imports: [{ name: 'chunk', as: 'etChunk', source: 'es-toolkit-base' }],
      bundles: { client: { rawBytes: 1000 }, server: { rawBytes: 2000 } },
    }
    const candidate = {
      moduleLoad: { incrementalMs: { median: 25 }, incrementalRssMiB: { median: 9 } },
      imports: [{ name: 'chunk', as: 'etChunk', source: 'es-toolkit-base' }],
      bundles: { client: { rawBytes: 1005 }, server: { rawBytes: 2010 } },
    }

    expect(evaluateV21Gates(baseline, candidate)).toEqual([
      expect.objectContaining({ name: 'cold-import-reduction', passed: true }),
      expect.objectContaining({ name: 'rss-reduction', passed: true }),
      expect.objectContaining({ name: 'import-manifest', passed: true }),
      expect.objectContaining({ name: 'client-bundle', passed: true }),
      expect.objectContaining({ name: 'server-bundle', passed: true }),
    ])
  })

  it('parses benchmark capture arguments', () => {
    expect(benchmarkRunner.parseBenchmarkArgs([
      '--root', '/repo',
      '--label', 'baseline',
      '--output', '/repo/.bench/baseline.json',
      '--runs', '20',
      '--prepare-runs', '5',
    ])).toEqual({
      root: '/repo',
      label: 'baseline',
      output: '/repo/.bench/baseline.json',
      runs: 20,
      prepareRuns: 5,
    })
  })

  it('ignores pnpm argument separators when parsing capture arguments', () => {
    expect(benchmarkRunner.parseBenchmarkArgs([
      '--root', '/repo',
      '--label', 'current',
      '--output', '/repo/.bench/current.json',
      '--',
      '--label', 'baseline',
      '--output', '/repo/.bench/baseline.json',
    ])).toMatchObject({
      label: 'baseline',
      output: '/repo/.bench/baseline.json',
    })
  })

  it('ignores pnpm argument separators when parsing comparison arguments', () => {
    expect(parseCompareArgs([
      '--',
      '--baseline', '/repo/.bench/baseline.json',
      '--candidate', '/repo/.bench/candidate.json',
      '--profile', 'v2.1',
    ])).toEqual({
      baseline: '/repo/.bench/baseline.json',
      candidate: '/repo/.bench/candidate.json',
      profile: 'v2.1',
    })
  })

  it('reports a failed reduction gate', () => {
    const baseline = {
      moduleLoad: { incrementalMs: { median: 100 }, incrementalRssMiB: { median: 20 } },
      imports: [],
      bundles: { client: { rawBytes: 1000 }, server: { rawBytes: 2000 } },
    }
    const candidate = {
      moduleLoad: { incrementalMs: { median: 40 }, incrementalRssMiB: { median: 11 } },
      imports: [],
      bundles: { client: { rawBytes: 1000 }, server: { rawBytes: 2000 } },
    }

    expect(evaluateV21Gates(baseline, candidate)[0]).toEqual({
      name: 'cold-import-reduction',
      passed: false,
    })
  })

  it('accepts comparable artifacts with zero candidate increments', () => {
    const options = writeBenchmarkPair((_baseline, candidate) => {
      candidate.moduleLoad.incrementalMs.median = 0
      candidate.moduleLoad.incrementalRssMiB.median = 0
    })

    expect(() => compare(options)).not.toThrow()
  })

  it.each([
    ['baseline.moduleLoad.incrementalMs.median', (baseline: ReturnType<typeof createBenchmark>) => {
      baseline.moduleLoad.incrementalMs.median = 0
    }],
    ['baseline.moduleLoad.incrementalRssMiB.median', (baseline: ReturnType<typeof createBenchmark>) => {
      baseline.moduleLoad.incrementalRssMiB.median = -1
    }],
    ['candidate.moduleLoad.incrementalMs.median', (_baseline: ReturnType<typeof createBenchmark>, candidate: ReturnType<typeof createBenchmark>) => {
      candidate.moduleLoad.incrementalMs.median = -0.001
    }],
    ['candidate.moduleLoad.incrementalRssMiB.median', (_baseline: ReturnType<typeof createBenchmark>, candidate: ReturnType<typeof createBenchmark>) => {
      candidate.moduleLoad.incrementalRssMiB.median = Number.NaN
    }],
  ])('rejects an invalid %s', (field, mutate) => {
    expectInvalidComparison(mutate, field)
  })

  it.each(['files', 'rawBytes', 'gzipBytes'] as const)(
    'rejects a zero candidate bundle %s measurement',
    (metric) => {
      expectInvalidComparison((_baseline, candidate) => {
        candidate.bundles.client[metric] = 0
      }, `candidate.bundles.client.${metric}`)
    },
  )

  it('rejects a negative baseline bundle measurement', () => {
    expectInvalidComparison((baseline) => {
      baseline.bundles.server.rawBytes = -1
    }, 'baseline.bundles.server.rawBytes')
  })

  it.each(['platform', 'architecture', 'node', 'pnpm', 'nuxt', 'esToolkit'] as const)(
    'rejects a mismatched environment.%s',
    (field) => {
      expectInvalidComparison((_baseline, candidate) => {
        candidate.environment[field] = `other-${candidate.environment[field]}`
      }, `environment.${field}`)
    },
  )

  it('retains schema-version and candidate-import-count validation', () => {
    expectInvalidComparison((_baseline, candidate) => {
      candidate.schemaVersion = 2
    }, 'candidate.schemaVersion')
    expectInvalidComparison((_baseline, candidate) => {
      candidate.imports.pop()
    }, 'candidate.imports.length')
  })

  it('rejects bundle directories without matching files', () => {
    const directory = mkdtempSync(join(tmpdir(), 'nuxt-es-toolkit-empty-bundle-'))

    try {
      expect(() => measureBundleDirectory(directory, ['.js']))
        .toThrow('No bundle files with extensions .js')
    }
    finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('rejects non-positive bundle byte totals', () => {
    const directory = mkdtempSync(join(tmpdir(), 'nuxt-es-toolkit-zero-bundle-'))
    writeFileSync(join(directory, 'empty.js'), '')

    try {
      expect(() => measureBundleDirectory(directory, ['.js']))
        .toThrow('rawBytes must be greater than 0')
    }
    finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it.each([
    ['linux', '-v'],
    ['darwin', '-l'],
  ])('selects the prepare RSS command for %s', (platform, flag) => {
    expect(benchmarkRunner.getPrepareTimeFlag?.(platform)).toBe(flag)
  })

  it('rejects unsupported prepare RSS platforms before capture work', () => {
    expect(() => benchmarkRunner.captureBenchmark({
      root: '/path/that/does-not-exist',
      label: 'unsupported-platform',
      output: '/path/that/does-not-exist/result.json',
      runs: 1,
      prepareRuns: 1,
      platform: 'win32',
    })).toThrow('Unsupported prepare RSS platform: win32. Supported platforms are linux and darwin.')
  })
})
