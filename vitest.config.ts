import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { defineConfig } from 'vitest/config'

const authRequire = createRequire(new URL('./node_modules/nuxt-auth-utils/dist/module.mjs', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#server': fileURLToPath(new URL('./server', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '#imports': fileURLToPath(new URL('./tests/auth/fixtures/runtime-config.ts', import.meta.url)),
      h3: authRequire.resolve('h3'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/integration/**'],
    // Resolve Nuxt's virtual imports while executing the actual installed OAuth runtime.
    server: { deps: { inline: ['nuxt-auth-utils'] } },
  },
})
