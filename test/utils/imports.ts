import { join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { useTestContext } from '@nuxt/test-utils/e2e'

export const readImports = () => {
  const ctx = useTestContext()
  const rootDir = ctx.nuxt?.options.rootDir || ctx.options.rootDir
  const candidates = [
    ctx.nuxt?.options.buildDir && join(ctx.nuxt.options.buildDir, 'imports.d.ts'),
    ctx.options.nuxtConfig?.buildDir && join(ctx.options.nuxtConfig.buildDir, 'imports.d.ts'),
    rootDir && join(rootDir, 'node_modules/.cache/nuxt/.nuxt/imports.d.ts'),
    rootDir && join(rootDir, '.nuxt/imports.d.ts'),
  ].filter((path): path is string => Boolean(path && existsSync(path)))

  const [first] = candidates
  if (!first) {
    throw new Error('imports.d.ts not found')
  }

  return readFileSync(first, 'utf8')
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const findImportLine = (imports: string, identifier: string) =>
  imports.split('\n').find(line => new RegExp(`(?<![$\\w])${escapeRegExp(identifier)}(?![$\\w])`).test(line))
