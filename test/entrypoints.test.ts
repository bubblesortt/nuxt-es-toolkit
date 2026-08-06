import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { findImportLine, readImports } from './utils/imports'

const fixture = fileURLToPath(new URL('./fixtures/entrypoints', import.meta.url))

describe('optional entrypoints', async () => {
  await setup({ rootDir: fixture })

  it('registers collision-resistant qualified imports', () => {
    const imports = readImports()

    expect(findImportLine(imports, 'useFpMap')).toContain('runtime/es-toolkit-fp')
    expect(findImportLine(imports, 'useMapFilter')).toContain('runtime/es-toolkit-map')
    expect(findImportLine(imports, 'useSetMap')).toContain('runtime/es-toolkit-set')
    expect(findImportLine(imports, 'useMap')).toBeUndefined()
  })

  it('executes each entrypoint during SSR', async () => {
    const html = await $fetch('/')

    expect(html).toContain('<div id="fp">[2,4]</div>')
    expect(html).toContain('<div id="map">[[&quot;b&quot;,2]]</div>')
    expect(html).toContain('<div id="set">[3,6]</div>')
  })
})
