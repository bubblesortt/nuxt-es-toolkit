import { describe, expect, it } from 'vitest'
import { findImportLine } from './imports'

describe('findImportLine', () => {
  it('matches a complete generated identifier', () => {
    const imports = [
      'export { chunkBy as useChunkBy } from \'es-toolkit\'',
      'export { chunk as useChunk } from \'es-toolkit\'',
    ].join('\n')

    expect(findImportLine(imports, 'useChunk')).toContain('chunk as useChunk')
  })
})
