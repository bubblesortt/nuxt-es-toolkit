import { describe, expect, it } from 'vitest'
import { assertNoEagerRuntimeImports } from '../scripts/check-module-output.mjs'

describe('built module output guard', () => {
  it('rejects eager runtime barrel imports', () => {
    expect(() => assertNoEagerRuntimeImports(
      // eslint-disable-next-line @stylistic/quotes
      "import * as toolkitBase from '../dist/runtime/es-toolkit-base.js'",
    )).toThrow('eagerly imports an es-toolkit runtime barrel')
  })

  it('allows ordinary module imports', () => {
    expect(() => assertNoEagerRuntimeImports(
      // eslint-disable-next-line @stylistic/quotes
      "import { addImports } from '@nuxt/kit'",
    )).not.toThrow()
  })
})
