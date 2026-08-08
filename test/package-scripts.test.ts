import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type PackageJson = {
  scripts: {
    bench: string
  }
}

describe('package scripts', () => {
  it('prepares and builds the module before benchmark capture', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as PackageJson

    expect(packageJson.scripts.bench.split(' && ')).toEqual([
      'pnpm dev:prepare',
      'pnpm prepack',
      'node bench/run.mjs --root . --label current --output .bench/current.json',
    ])
  })
})
