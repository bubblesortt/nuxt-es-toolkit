import { describe, expect, it } from 'vitest'
import { assertNoEagerRuntimeImports } from '../scripts/check-module-output.mjs'

describe('built module output guard', () => {
  it.each([
    [
      'namespace local-barrel imports',
      // eslint-disable-next-line @stylistic/quotes
      "import * as toolkitBase from '../dist/runtime/es-toolkit-base.js'",
      '../dist/runtime/es-toolkit-base.js',
    ],
    [
      'named local-barrel imports',
      // eslint-disable-next-line @stylistic/quotes
      "import { chunk } from './runtime/es-toolkit-base.js'",
      './runtime/es-toolkit-base.js',
    ],
    [
      'default local-barrel imports',
      // eslint-disable-next-line @stylistic/quotes
      "import toolkit from './runtime/es-toolkit-fp.js'",
      './runtime/es-toolkit-fp.js',
    ],
    [
      'mixed local-barrel imports',
      // eslint-disable-next-line @stylistic/quotes
      "import toolkit, { map } from './runtime/es-toolkit-map.js'",
      './runtime/es-toolkit-map.js',
    ],
    [
      'multiline local-barrel imports',
      // eslint-disable-next-line @stylistic/quotes
      "import {\n  map,\n} from './runtime/es-toolkit-set.js'",
      './runtime/es-toolkit-set.js',
    ],
    [
      'side-effect local-barrel imports',
      // eslint-disable-next-line @stylistic/quotes
      "import './runtime/es-toolkit-compat-all.js'",
      './runtime/es-toolkit-compat-all.js',
    ],
    [
      'namespace package imports',
      // eslint-disable-next-line @stylistic/quotes
      "import * as toolkit from 'es-toolkit'",
      'es-toolkit',
    ],
    [
      'named package-subpath imports',
      // eslint-disable-next-line @stylistic/quotes
      "import { add } from 'es-toolkit/compat'",
      'es-toolkit/compat',
    ],
    [
      'default package-subpath imports',
      // eslint-disable-next-line @stylistic/quotes
      "import toolkit from 'es-toolkit/fp'",
      'es-toolkit/fp',
    ],
    [
      'mixed package imports',
      // eslint-disable-next-line @stylistic/quotes
      "import toolkit, { chunk } from 'es-toolkit'",
      'es-toolkit',
    ],
    [
      'multiline package-subpath imports',
      // eslint-disable-next-line @stylistic/quotes
      "import {\n  filter,\n} from 'es-toolkit/map'",
      'es-toolkit/map',
    ],
    [
      'side-effect package-subpath imports',
      // eslint-disable-next-line @stylistic/quotes
      "import 'es-toolkit/compat'",
      'es-toolkit/compat',
    ],
  ])('rejects %s', (_description, code, source) => {
    expect(() => assertNoEagerRuntimeImports(code))
      .toThrow(`Static import from ${source}`)
  })

  it.each([
    [
      'ordinary static imports',
      // eslint-disable-next-line @stylistic/quotes
      "import { addImports } from '@nuxt/kit'",
    ],
    [
      'similarly named packages',
      // eslint-disable-next-line @stylistic/quotes
      "import toolkit from 'es-toolkit-extra'",
    ],
    [
      'dynamic package imports',
      // eslint-disable-next-line @stylistic/quotes
      "const toolkit = await import('es-toolkit')",
    ],
    [
      'dynamic package-subpath imports',
      // eslint-disable-next-line @stylistic/quotes
      "const compat = import('es-toolkit/compat')",
    ],
    [
      'dynamic local-barrel imports',
      // eslint-disable-next-line @stylistic/quotes
      "const base = import('./runtime/es-toolkit-base.js')",
    ],
    [
      'import-like strings and comments',
      // eslint-disable-next-line @stylistic/quotes
      "const example = \"import 'es-toolkit'\"\n// import 'es-toolkit/compat'",
    ],
  ])('allows %s', (_description, code) => {
    expect(() => assertNoEagerRuntimeImports(code)).not.toThrow()
  })
})
