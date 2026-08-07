import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { readImports } from './utils/imports'

const fixture = fileURLToPath(new URL('./fixtures/pskip-has', import.meta.url))

describe('prefixSkip list replaces (not concatenates with is)', async () => {
  await setup({ rootDir: fixture, server: false, build: true })

  it('has* stay bare AND is* get prefixed (no hidden ["is"] merge)', () => {
    const imports = readImports()
    // has/hasIn start with 'has' -> should be bare
    expect(imports).toMatch(/(^|[^a-zA-Z])hasIn([,} ]|$)/m)
    // is* no longer skipped -> should be prefixed now
    expect(imports).toContain('etIsNotNil')
  })
})
