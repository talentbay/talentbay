import { execFileSync } from 'node:child_process'
import { defineConfig, devices } from '@playwright/test'
import { testBotToken, testEntryBotID, testWebhookSecret } from './tests/e2e/support/telegram'

// Refuse remote/shared databases before a server or a fixture can write anything.
execFileSync(process.execPath, ['scripts/assert-ci-database.mjs'], { stdio: 'inherit' })

export default defineConfig({
  testDir: './tests/e2e', testMatch: '**/*.database.ts', fullyParallel: false, workers: 1,
  forbidOnly: Boolean(process.env.CI), retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/database', open: 'never' }]],
  outputDir: 'test-results/database',
  use: { baseURL: 'http://127.0.0.1:3129', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium-db', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node .output/server/index.mjs', url: 'http://127.0.0.1:3129/api/health',
    reuseExistingServer: false, gracefulShutdown: { signal: 'SIGTERM', timeout: 3000 },
    env: {
      HOST: '127.0.0.1', PORT: '3129', DATABASE_URL: process.env.DATABASE_URL!, DATABASE_MIGRATION_URL: process.env.DATABASE_MIGRATION_URL!,
      NUXT_SESSION_PASSWORD: 'playwright-database-session-fixture-at-least-32-characters', NUXT_TELEGRAM_BOT_TOKEN: testBotToken,
      NUXT_TELEGRAM_BOT_ID: testEntryBotID, NUXT_TELEGRAM_BOT_USERNAME: 'talentbay_test_bot',
      NUXT_TELEGRAM_WEBHOOK_SECRET: testWebhookSecret, NUXT_TELEGRAM_APP_ORIGIN: 'https://talentbay.example',
      NUXT_OAUTH_GOOGLE_CLIENT_ID: '', NUXT_OAUTH_GOOGLE_CLIENT_SECRET: '', NUXT_OAUTH_GITHUB_CLIENT_ID: '', NUXT_OAUTH_GITHUB_CLIENT_SECRET: '',
    },
  },
})
