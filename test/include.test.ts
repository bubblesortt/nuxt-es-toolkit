import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { findImportLine, readImports } from './utils/imports'

const fixture = fileURLToPath(new URL('./fixtures/include', import.meta.url))

describe('include allowlist', async () => {
  await setup({
    rootDir: fixture,
    server: false,
    build: true,
  })

  it('registers only explicitly included utilities', () => {
    const imports = readImports()

    expect(findImportLine(imports, 'etChunk')).toBeDefined()
    expect(findImportLine(imports, 'etIsNotNil')).toBeDefined()
    expect(findImportLine(imports, 'etMax')).toBeUndefined()
  })
})
