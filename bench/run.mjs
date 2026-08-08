import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import process from 'node:process'
import {
  measureBundleDirectory,
  normalizeToolkitImports,
  summarize,
} from './metrics.mjs'

export const parseBenchmarkArgs = (argv) => {
  const values = new Map()
  const argumentsWithoutSeparators = argv.filter(argument => argument !== '--')
  for (let index = 0; index < argumentsWithoutSeparators.length; index += 2) {
    values.set(argumentsWithoutSeparators[index], argumentsWithoutSeparators[index + 1])
  }
  const root = values.get('--root')
  const label = values.get('--label')
  const output = values.get('--output')
  if (!root || !label || !output) {
    throw new Error('Required arguments: --root, --label, and --output.')
  }
  return {
    root,
    label,
    output,
    runs: Number(values.get('--runs') ?? 20),
    prepareRuns: Number(values.get('--prepare-runs') ?? 5),
  }
}

const run = (command, args, options) => {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options })
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} exited with ${result.status}`)
  }
  return result.stdout
}

export const getPrepareTimeFlag = (platform) => {
  if (platform === 'linux') {
    return '-v'
  }
  if (platform === 'darwin') {
    return '-l'
  }
  throw new Error(`Unsupported prepare RSS platform: ${platform}. Supported platforms are linux and darwin.`)
}

const measureColdImport = (specifier, root) => {
  const script = [
    'const beforeRss = process.memoryUsage().rss',
    'const startedAt = performance.now()',
    `await import(${JSON.stringify(specifier)})`,
    'console.log(JSON.stringify({ elapsedMs: performance.now() - startedAt, rssMiB: (process.memoryUsage().rss - beforeRss) / 1024 / 1024 }))',
  ].join(';')
  const output = run(process.execPath, ['--input-type=module', '--eval', script], { cwd: root })
  return JSON.parse(output.trim().split('\n').at(-1))
}

const measureModuleLoad = (root, runs) => {
  const sources = [
    '@nuxt/kit',
    pathToFileURL(join(root, 'dist/module.mjs')).href,
  ]
  for (let index = 0; index < 3; index += 1) {
    for (const source of sources) {
      measureColdImport(source, root)
    }
  }

  const samples = sources.map((source) => {
    const values = []
    for (let index = 0; index < runs; index += 1) {
      values.push(measureColdImport(source, root))
    }
    return values
  })
  const [kitSamples, moduleSamples] = samples
  const kitElapsed = summarize(kitSamples.map(sample => sample.elapsedMs))
  const moduleElapsed = summarize(moduleSamples.map(sample => sample.elapsedMs))
  const kitRss = summarize(kitSamples.map(sample => sample.rssMiB))
  const moduleRss = summarize(moduleSamples.map(sample => sample.rssMiB))

  return {
    incrementalMs: { median: moduleElapsed.median - kitElapsed.median },
    incrementalRssMiB: { median: moduleRss.median - kitRss.median },
  }
}

const parseMaximumRss = (output, platform) => {
  const match = platform === 'linux'
    ? output.match(/Maximum resident set size \(kbytes\):\s+(\d+)/)
    : output.match(/(\d+)\s+maximum resident set size/)
  if (!match) {
    throw new Error('Could not parse maximum RSS from /usr/bin/time output.')
  }
  const value = Number(match[1])
  return platform === 'linux' ? value / 1024 : value / 1024 / 1024
}

const measurePrepare = (root, runs, platform, timeFlag) => {
  const sample = () => {
    const startedAt = performance.now()
    const result = spawnSync('/usr/bin/time', [timeFlag, 'pnpm', 'exec', 'nuxi', 'prepare', 'playground'], {
      cwd: root,
      encoding: 'utf8',
    })
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || `nuxi prepare exited with ${result.status}`)
    }
    return {
      elapsedMs: performance.now() - startedAt,
      maxRssMiB: parseMaximumRss(result.stderr, platform),
    }
  }

  for (let index = 0; index < 3; index += 1) {
    sample()
  }
  const samples = Array.from({ length: runs }, sample)
  return {
    elapsedMs: summarize(samples.map(sample => sample.elapsedMs)),
    maxRssMiB: summarize(samples.map(sample => sample.maxRssMiB)),
  }
}

export const captureBenchmark = (options) => {
  const platform = options.platform ?? process.platform
  const prepareTimeFlag = getPrepareTimeFlag(platform)
  const root = resolve(options.root)
  const output = resolve(options.output)
  const moduleLoad = measureModuleLoad(root, options.runs)
  const prepare = measurePrepare(root, options.prepareRuns, platform, prepareTimeFlag)
  run('pnpm', ['dev:build'], { cwd: root })

  const declarationCandidates = [
    join(root, 'playground/node_modules/.cache/nuxt/.nuxt/imports.d.ts'),
    join(root, 'playground/.nuxt/imports.d.ts'),
    join(root, '.nuxt/imports.d.ts'),
  ]
  const declarationPath = declarationCandidates.find(existsSync)
  if (!declarationPath) {
    throw new Error('Could not find generated imports.d.ts.')
  }
  const declaration = readFileSync(declarationPath, 'utf8')
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const esToolkitPackageJson = JSON.parse(readFileSync(join(root, 'node_modules/es-toolkit/package.json'), 'utf8'))
  const nuxtPackageJson = JSON.parse(readFileSync(join(root, 'node_modules/nuxt/package.json'), 'utf8'))
  const benchmark = {
    schemaVersion: 1,
    label: options.label,
    environment: {
      gitSha: run('git', ['rev-parse', 'HEAD'], { cwd: root }).trim(),
      platform,
      architecture: process.arch,
      node: process.version,
      pnpm: run('pnpm', ['--version'], { cwd: root }).trim(),
      nuxt: nuxtPackageJson.version,
      module: packageJson.version,
      esToolkit: esToolkitPackageJson.version,
    },
    moduleLoad,
    prepare,
    imports: normalizeToolkitImports(declaration),
    declarations: { bytes: Buffer.byteLength(declaration) },
    bundles: {
      client: measureBundleDirectory(join(root, 'playground/.output/public/_nuxt'), ['.js']),
      server: measureBundleDirectory(join(root, 'playground/.output/server'), ['.mjs']),
    },
  }

  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(benchmark, null, 2)}\n`)
  return benchmark
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseBenchmarkArgs(process.argv.slice(2))
  const benchmark = captureBenchmark(options)
  console.log(`Wrote ${benchmark.imports.length} normalized imports to ${resolve(options.output)}`)
}
