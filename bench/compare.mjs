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

export const compare = (options) => {
  const baseline = readBenchmark(options.baseline)
  const candidate = readBenchmark(options.candidate)
  if (baseline.schemaVersion !== 1 || candidate.schemaVersion !== 1) {
    throw new Error('Benchmark schema version must be 1.')
  }
  if (candidate.imports.length !== 185) {
    throw new Error(`Expected 185 normalized imports, received ${candidate.imports.length}.`)
  }

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
