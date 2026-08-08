import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { gzipSync } from 'node:zlib'

const round = value => Math.round(value * 1000) / 1000
const compareStrings = (left, right) => left < right ? -1 : left > right ? 1 : 0

export const summarize = (values) => {
  if (values.length === 0) {
    throw new Error('Cannot summarize an empty sample.')
  }
  const sorted = [...values].sort((left, right) => left - right)
  const percentile = ratio => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)]
  return {
    min: round(sorted[0]),
    max: round(sorted.at(-1)),
    median: round(percentile(0.5)),
    p95: round(percentile(0.95)),
  }
}

export const normalizeToolkitImports = (declaration) => {
  const imports = []
  // The required source capture is bounded by a subsequent quoted suffix.
  // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
  const linePattern = /export \{([^}]+)\} from ['"][^'"]*\/runtime\/(es-toolkit-[^.'"]+)[^'"]*['"]/g
  for (const match of declaration.matchAll(linePattern)) {
    const source = match[2]
    for (const specifier of match[1].split(',')) {
      const [name, as = name] = specifier.trim().split(/\s+as\s+/)
      imports.push({ name, as, source })
    }
  }
  return imports.sort((left, right) =>
    compareStrings(left.source, right.source)
    || compareStrings(left.as, right.as)
    || compareStrings(left.name, right.name),
  )
}

const listFiles = directory => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name)
  return entry.isDirectory() ? listFiles(path) : [path]
})

export const measureBundleDirectory = (directory, extensions) => {
  const files = listFiles(directory).filter(path => extensions.includes(extname(path)))
  if (files.length === 0) {
    throw new Error(`No bundle files with extensions ${extensions.join(', ')} found in ${directory}.`)
  }

  const metric = files.reduce((metric, path) => {
    const contents = readFileSync(path)
    metric.files += 1
    metric.rawBytes += statSync(path).size
    metric.gzipBytes += gzipSync(contents).length
    return metric
  }, { files: 0, rawBytes: 0, gzipBytes: 0 })

  for (const field of ['files', 'rawBytes', 'gzipBytes']) {
    if (!Number.isFinite(metric[field]) || metric[field] <= 0) {
      throw new Error(`Invalid bundle measurement for ${directory}: ${field} must be greater than 0, received ${metric[field]}.`)
    }
  }
  return metric
}

const reduction = (baseline, candidate) => (baseline - candidate) / baseline
const growth = (baseline, candidate) => (candidate - baseline) / baseline

export const evaluateV21Gates = (baseline, candidate) => [
  {
    name: 'cold-import-reduction',
    passed: reduction(baseline.moduleLoad.incrementalMs.median, candidate.moduleLoad.incrementalMs.median) >= 0.7,
  },
  {
    name: 'rss-reduction',
    passed: reduction(baseline.moduleLoad.incrementalRssMiB.median, candidate.moduleLoad.incrementalRssMiB.median) >= 0.5,
  },
  {
    name: 'import-manifest',
    passed: JSON.stringify(baseline.imports) === JSON.stringify(candidate.imports),
  },
  {
    name: 'client-bundle',
    passed: growth(baseline.bundles.client.rawBytes, candidate.bundles.client.rawBytes) <= 0.01,
  },
  {
    name: 'server-bundle',
    passed: growth(baseline.bundles.server.rawBytes, candidate.bundles.server.rawBytes) <= 0.01,
  },
]
