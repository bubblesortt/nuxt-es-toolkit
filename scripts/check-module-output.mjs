import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const modulePath = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/module.mjs')

export const assertNoEagerRuntimeImports = (code) => {
  const eagerImport = /import \* as \w+ from ['"][^'"]*runtime\/es-toolkit-/
  if (eagerImport.test(code)) {
    throw new Error('Built module eagerly imports an es-toolkit runtime barrel.')
  }
}

const run = async () => {
  assertNoEagerRuntimeImports(await readFile(modulePath, 'utf8'))
  console.log(modulePath)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await run()
}
