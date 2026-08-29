import { defineMain } from '@storybook/nextjs-vite/node'
import tailwindcss from '@tailwindcss/vite'

export default defineMain({
  stories: [
    '../components/**/*.stories.@(ts|tsx)',
    // vault/ primitives are catalogued alongside the base components — every
    // primitive there is required to ship a story (see vault/README.md).
    '../vault/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-mcp'],
  framework: '@storybook/nextjs-vite',
  async viteFinal(config) {
    const { mergeConfig } = await import('vite')
    return mergeConfig(config, {
      plugins: [tailwindcss()],
    })
  },
  docs: {},
})
