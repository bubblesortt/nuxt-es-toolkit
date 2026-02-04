import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { readImports } from './../utils/imports'

const fixture = fileURLToPath(new URL('../fixtures/compat/prefer', import.meta.url))

describe('compat prefer default', async () => {
  await setup({
    rootDir: fixture,
    server: false,
    build: true,
  })

  it('includes compat and base exports', () => {
    const imports = readImports()
    expect(imports).toContain('useAdd')
    expect(imports).toMatch(/\bisNotNil\b/)
  })
})
