import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const modulePath = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/module.mjs')

export const assertNoEagerRuntimeImports = (code) => {
  const sourceFile = ts.createSourceFile('module.mjs', code, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS)
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue
    }

    const source = statement.moduleSpecifier.text
    const isPackageImport = source === 'es-toolkit' || source.startsWith('es-toolkit/')
    const isRuntimeBarrelImport = /(?:^|\/)runtime\/es-toolkit-[^/?#]+(?:[?#].*)?$/.test(source)
    if (isPackageImport || isRuntimeBarrelImport) {
      throw new Error(`Static import from ${source} eagerly loads es-toolkit during module setup.`)
    }
  }
}

const run = async () => {
  assertNoEagerRuntimeImports(await readFile(modulePath, 'utf8'))
  console.log(modulePath)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await run()
}
