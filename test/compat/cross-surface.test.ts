import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { findImportLine, readImports } from '../utils/imports'

const fixture = fileURLToPath(new URL('../fixtures/compat/cross-surface', import.meta.url))

describe('cross-surface override', async () => {
  await setup({
    rootDir: fixture,
    server: false,
    build: true,
  })

  it('registers a base-only method in compat-only mode', () => {
    const imports = readImports()
    const line = findImportLine(imports, 'isNotNil')

    expect(line).toContain('runtime/es-toolkit-base')
  })
})
