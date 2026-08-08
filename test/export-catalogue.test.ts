import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import {
  discoverExportCatalogue,
  renderExportCatalogue,
} from '../scripts/export-catalogue.mjs'

const execFileAsync = promisify(execFile)

describe('export catalogue', () => {
  it('renders sorted deterministic TypeScript', () => {
    const output = renderExportCatalogue({
      version: '1.50.0',
      surfaces: {
        base: ['sum', 'chunk'],
        compat: ['add'],
        fp: ['map'],
        map: ['filter'],
        set: ['reduce'],
      },
    })

    expect(output).toContain('export const esToolkitVersion = \'1.50.0\'')
    expect(output.indexOf('  \'chunk\','))
      .toBeLessThan(output.indexOf('  \'sum\','))
    expect(output.endsWith('\n')).toBe(true)
  })

  it('keeps the committed catalogue synchronized with installed entrypoints', async () => {
    const actual = renderExportCatalogue(await discoverExportCatalogue())
    const committed = await readFile('src/generated/es-toolkit-exports.ts', 'utf8')

    expect(committed).toBe(actual)
  })

  it('checks the catalogue from a nested working directory', async () => {
    await expect(execFileAsync(process.execPath, [
      '../scripts/export-catalogue.mjs',
      '--check',
    ], { cwd: 'test' })).resolves.toBeDefined()
  })
})
