import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

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
})
