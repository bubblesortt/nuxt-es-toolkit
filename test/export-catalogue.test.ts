import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import * as basePackage from 'es-toolkit'
import * as compatPackage from 'es-toolkit/compat'
import * as fpPackage from 'es-toolkit/fp'
import * as mapPackage from 'es-toolkit/map'
import * as setPackage from 'es-toolkit/set'
import * as baseBarrel from '../src/runtime/es-toolkit-base'
import * as compatBarrel from '../src/runtime/es-toolkit-compat-all'
import * as fpBarrel from '../src/runtime/es-toolkit-fp'
import * as mapBarrel from '../src/runtime/es-toolkit-map'
import * as setBarrel from '../src/runtime/es-toolkit-set'
import {
  discoverExportCatalogue,
  renderExportCatalogue,
} from '../scripts/export-catalogue.mjs'

const execFileAsync = promisify(execFile)
const surfaces = ['base', 'compat', 'fp', 'map', 'set'] as const
const installedSurfaces = {
  base: basePackage,
  compat: compatPackage,
  fp: fpPackage,
  map: mapPackage,
  set: setPackage,
}
const barrelSurfaces = {
  base: baseBarrel,
  compat: compatBarrel,
  fp: fpBarrel,
  map: mapBarrel,
  set: setBarrel,
}

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

  it('models export-star semantics for every package-owned runtime barrel', async () => {
    const catalogue = await discoverExportCatalogue()

    for (const surface of surfaces) {
      const installedNames = Object.keys(installedSurfaces[surface])
        .filter(name => name !== 'default')
        .sort()
      const barrelNames = Object.keys(barrelSurfaces[surface]).sort()

      expect(barrelNames, `${surface} barrel`).toEqual(installedNames)
      expect(catalogue.surfaces[surface], `${surface} catalogue`).toEqual(barrelNames)
    }
  })

  it('checks the catalogue from a nested working directory', async () => {
    await expect(execFileAsync(process.execPath, [
      '../scripts/export-catalogue.mjs',
      '--check',
    ], { cwd: 'test' })).resolves.toBeDefined()
  })
})
