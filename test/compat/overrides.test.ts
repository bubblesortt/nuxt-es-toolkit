import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { readImports, findImportLine } from './../utils/imports'

const fixture = fileURLToPath(new URL('../fixtures/compat/overrides', import.meta.url))

describe('compat overrides in prefer mode', async () => {
  await setup({
    rootDir: fixture,
    server: false,
    build: true,
  })

  it('imports forced methods from specified entries', () => {
    const imports = readImports()
    const chunkLine = findImportLine(imports, 'useChunk')
    const compactLine = findImportLine(imports, 'useCompact')

    expect(chunkLine).toContain('runtime/es-toolkit-compat-all')
    expect(compactLine).toContain('runtime/es-toolkit-base')
  })
})
