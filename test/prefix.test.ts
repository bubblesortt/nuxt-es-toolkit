import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { readImports } from './utils/imports'

const fixture = fileURLToPath(new URL('./fixtures/prefix', import.meta.url))

describe('prefix option', async () => {
  await setup({
    rootDir: fixture,
    server: false,
    build: true,
  })

  it('disables the prefix and keeps original casing when prefix is blank', () => {
    const imports = readImports()

    // A regular (non-predicate) function is registered without the `et` prefix ...
    expect(imports).not.toContain('etUpperFirst')
    // ... and without a leading-space identifier (the bug a blank prefix used to cause)
    expect(imports).not.toMatch(/\sUpperFirst/)
    // ... but with its bare, original-casing name
    expect(imports).toMatch(/\bupperFirst\b/)
    // A blank prefix also keeps predicate names bare.
    expect(imports).toMatch(/\bisNotNil\b/)
  })
})
