import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { readImports } from './utils/imports'

const fixture = fileURLToPath(new URL('./fixtures/prefixskip-empty', import.meta.url))

describe('prefixSkip option', async () => {
  await setup({
    rootDir: fixture,
    server: false,
    build: true,
  })

  it('an empty array disables prefix-skipping (is* get the prefix)', () => {
    // Regression for https://github.com/bubblesortt/nuxt-es-toolkit/issues/3
    // Previously `defu` dropped the empty array and restored the ['is'] default,
    // so predicate names stayed bare.
    const imports = readImports()

    expect(imports).toContain('useIsNotNil')
    expect(imports).toContain('useIsString')
  })
})
