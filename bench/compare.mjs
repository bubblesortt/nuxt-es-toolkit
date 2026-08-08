import { readFileSync } from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { evaluateV21Gates } from './metrics.mjs'

export const parseCompareArgs = (argv) => {
  const values = new Map()
  const argumentsWithoutSeparators = argv.filter(argument => argument !== '--')
  for (let index = 0; index < argumentsWithoutSeparators.length; index += 2) {
    values.set(argumentsWithoutSeparators[index], argumentsWithoutSeparators[index + 1])
  }
  const baseline = values.get('--baseline')
  const candidate = values.get('--candidate')
  const profile = values.get('--profile')
  if (!baseline || !candidate || !profile) {
    throw new Error('Required arguments: --baseline, --candidate, and --profile.')
  }
  if (profile !== 'v2.1') {
    throw new Error(`Unsupported benchmark profile: ${profile}`)
  }
  return { baseline, candidate, profile }
}

const readBenchmark = path => JSON.parse(readFileSync(path, 'utf8'))

const environmentFields = ['platform', 'architecture', 'node', 'pnpm', 'nuxt', 'esToolkit']
const bundleSurfaces = ['client', 'server']
const bundleMetrics = ['files', 'rawBytes', 'gzipBytes']
const readField = (value, path) => path.split('.').reduce((current, key) => current?.[key], value)
const formatValue = value => typeof value === 'string' ? JSON.stringify(value) : String(value)

const assertFiniteNumber = (name, benchmark, field, comparison, expectation) => {
  const value = readField(benchmark, field)
  if (typeof value !== 'number' || !Number.isFinite(value) || !comparison(value)) {
    throw new Error(
      `Invalid ${name}.${field}: expected a finite number ${expectation}, received ${formatValue(value)}.`,
    )
  }
}

export const validateV21Benchmarks = (baseline, candidate) => {
  for (const [name, benchmark] of [['baseline', baseline], ['candidate', candidate]]) {
    if (benchmark.schemaVersion !== 1) {
      throw new Error(`Invalid ${name}.schemaVersion: expected 1, received ${formatValue(benchmark.schemaVersion)}.`)
    }
  }

  if (!Array.isArray(baseline.imports)) {
    throw new TypeError('Invalid baseline.imports: expected an array.')
  }
  if (!Array.isArray(candidate.imports) || candidate.imports.length !== 185) {
    throw new Error(`Invalid candidate.imports.length: expected 185, received ${formatValue(candidate.imports?.length)}.`)
  }

  assertFiniteNumber('baseline', baseline, 'moduleLoad.incrementalMs.median', value => value > 0, 'greater than 0')
  assertFiniteNumber('baseline', baseline, 'moduleLoad.incrementalRssMiB.median', value => value > 0, 'greater than 0')
  assertFiniteNumber('candidate', candidate, 'moduleLoad.incrementalMs.median', value => value >= 0, 'greater than or equal to 0')
  assertFiniteNumber('candidate', candidate, 'moduleLoad.incrementalRssMiB.median', value => value >= 0, 'greater than or equal to 0')

  for (const [name, benchmark] of [['baseline', baseline], ['candidate', candidate]]) {
    for (const surface of bundleSurfaces) {
      for (const metric of bundleMetrics) {
        const field = `bundles.${surface}.${metric}`
        assertFiniteNumber(name, benchmark, field, value => value > 0, 'greater than 0')
      }
    }
  }

  for (const field of environmentFields) {
    const baselineValue = baseline.environment?.[field]
    const candidateValue = candidate.environment?.[field]
    if (typeof baselineValue !== 'string' || baselineValue.length === 0) {
      throw new Error(`Invalid baseline.environment.${field}: expected a non-empty string.`)
    }
    if (typeof candidateValue !== 'string' || candidateValue.length === 0) {
      throw new Error(`Invalid candidate.environment.${field}: expected a non-empty string.`)
    }
    if (baselineValue !== candidateValue) {
      throw new Error(
        `Benchmark environment mismatch for environment.${field}: baseline ${formatValue(baselineValue)}, candidate ${formatValue(candidateValue)}.`,
      )
    }
  }
}

export const compare = (options) => {
  const baseline = readBenchmark(options.baseline)
  const candidate = readBenchmark(options.candidate)
  validateV21Benchmarks(baseline, candidate)

  const gates = evaluateV21Gates(baseline, candidate)
  console.log([
    '| Gate | Status |',
    '| --- | --- |',
    ...gates.map(gate => `| ${gate.name} | ${gate.passed ? 'PASS' : 'FAIL'} |`),
  ].join('\n'))
  if (gates.some(gate => !gate.passed)) {
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  compare(parseCompareArgs(process.argv.slice(2)))
}
