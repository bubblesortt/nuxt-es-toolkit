import { describe, expectTypeOf, it } from 'vitest'
import type {
  BaseToolkitMethod,
  CompatToolkitMethod,
  ToolkitMethod,
} from '../src/module'

describe('generated method types', () => {
  it('keeps base, compat, and qualified names in public unions', () => {
    expectTypeOf<'chunk'>().toExtend<BaseToolkitMethod>()
    expectTypeOf<'add'>().toExtend<CompatToolkitMethod>()
    expectTypeOf<'fp.map'>().toExtend<ToolkitMethod>()
    expectTypeOf<'map.filter'>().toExtend<ToolkitMethod>()
    expectTypeOf<'set.map'>().toExtend<ToolkitMethod>()

    expectTypeOf<Extract<BaseToolkitMethod, 'chunk'>>().toEqualTypeOf<'chunk'>()
    expectTypeOf<Extract<CompatToolkitMethod, 'add'>>().toEqualTypeOf<'add'>()
    expectTypeOf<Extract<ToolkitMethod, 'fp.map'>>().toEqualTypeOf<'fp.map'>()
    expectTypeOf<Extract<ToolkitMethod, 'map.filter'>>().toEqualTypeOf<'map.filter'>()
    expectTypeOf<Extract<ToolkitMethod, 'set.map'>>().toEqualTypeOf<'set.map'>()
  })
})
