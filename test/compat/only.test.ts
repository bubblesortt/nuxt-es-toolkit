import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { readImports, findImportLine } from './../utils/imports'

const fixture = fileURLToPath(new URL('../fixtures/compat/only', import.meta.url))

describe('compat only mode', async () => {
  await setup({
    rootDir: fixture,
    server: false,
    build: true,
  })

  it('skips base-only exports by default and allows base overrides', () => {
    const imports = readImports()
    const compactLine = findImportLine(imports, 'etCompact')

    expect(imports).toContain('etAdd')
    expect(imports).not.toMatch(/\betIsNotNil\b/)
    expect(compactLine).toContain('runtime/es-toolkit-base')
  })
})
