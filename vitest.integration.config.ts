import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { assertCiDatabaseEnvironment } from './scripts/assert-ci-database.mjs'

// Refuse unsafe connections before importing any test module or its SQL clients.
assertCiDatabaseEnvironment()

export default defineConfig({
  resolve: {
    alias: {
      '#server': fileURLToPath(new URL('./server', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
