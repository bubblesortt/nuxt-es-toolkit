import { describe, expect, it } from 'vitest'
import {
  evaluateV21Gates,
  normalizeToolkitImports,
  summarize,
} from '../bench/metrics.mjs'
import { parseCompareArgs } from '../bench/compare.mjs'
import { parseBenchmarkArgs } from '../bench/run.mjs'

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
    expect(parseBenchmarkArgs([
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
    expect(parseBenchmarkArgs([
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
})
