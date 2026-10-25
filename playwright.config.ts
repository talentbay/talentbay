import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  outputDir: 'test-results/public',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/public', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3127', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node .output/server/index.mjs',
    url: 'http://127.0.0.1:3127/api/health',
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 3000 },
    env: {
      HOST: '127.0.0.1', PORT: '3127', DATABASE_URL: '', DATABASE_MIGRATION_URL: '',
      NUXT_SESSION_PASSWORD: 'playwright-local-session-fixture-at-least-32-characters',
      NUXT_TELEGRAM_BOT_TOKEN: '',
      NUXT_OAUTH_GOOGLE_CLIENT_ID: '', NUXT_OAUTH_GOOGLE_CLIENT_SECRET: '',
      NUXT_OAUTH_GITHUB_CLIENT_ID: '', NUXT_OAUTH_GITHUB_CLIENT_SECRET: '',
    },
  },
})
