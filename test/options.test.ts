import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { readImports } from './utils/imports'

const fixture = fileURLToPath(new URL('./fixtures/options', import.meta.url))

describe('legacy options', async () => {
  await setup({
    rootDir: fixture,
    server: false,
    build: true,
  })

  it('keeps alias, exclude, and prefixSkip behavior', () => {
    const imports = readImports()

    expect(imports).toContain('useMaximum')
    expect(imports).not.toMatch(/\buseMax\b/)
    expect(imports).not.toMatch(/\buseSum\b/)
    expect(imports).not.toMatch(/\buseMap\b/)
    expect(imports).toMatch(/\bisNotNil\b/)
    expect(imports).not.toMatch(/\buseIsNotNil\b/)
  })
})
