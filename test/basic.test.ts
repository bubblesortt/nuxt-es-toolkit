import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { findImportLine, normalizeGeneratedToolkitImports, readImports } from './utils/imports'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })

  it('renders values from auto-imported methods', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<div id="sum">5</div>')
    expect(html).toContain('<div id="chunk">[[1,2],[3,4]]</div>')
    expect(html).toContain('<div id="not-nil">false</div>')
    expect(html).toContain('<div id="upper">Hello</div>')
  })

  it('uses base exports and collision-resistant names by default', () => {
    const imports = readImports()

    expect(findImportLine(imports, 'etSum')).toContain('runtime/es-toolkit-base')
    expect(findImportLine(imports, 'etIsNotNil')).toContain('runtime/es-toolkit-base')
    expect(findImportLine(imports, 'etAdd')).toBeUndefined()
    expect(findImportLine(imports, 'useChunk')).toBeUndefined()
    expect(normalizeGeneratedToolkitImports(imports)).toHaveLength(185)
  })
})
