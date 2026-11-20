import { expect, test } from '@playwright/test'

const botUrl = 'https://t.me/fixture_entry_bot'
const botLink = { name: 'Open Telegram bot', exact: true } as const
const telegramOnly = { google: false, github: false, telegram: true }

test('guest Profile opens the configured bot separately and leaves the browser signed out', async ({ page, context }) => {
  await page.route('**/api/v1/auth/capabilities', route => route.fulfill({
    json: { ...telegramOnly, telegramBotUrl: botUrl },
  }))
  await context.route('https://t.me/**', route => route.fulfill({ contentType: 'text/plain', body: 'Bot fixture' }))
  await page.goto('/profile')
  const link = page.getByRole('link', botLink)
  await expect(link).toHaveAttribute('href', botUrl)
  await expect(page.getByText(/This browser stays signed out/)).toBeVisible()
  const opened = page.waitForEvent('popup')
  await link.click()
  const popup = await opened
  await expect(popup).toHaveURL(botUrl)
  await popup.close()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { name: 'Your TalentBay account' })).toBeVisible()
})

test('guest Profile offers no bot link in a disabled preview or without a public username', async ({ page }) => {
  await page.goto('/profile')
  await expect(page.getByText(/Sign-in is not available in this preview/)).toBeVisible()
  await expect(page.getByRole('link', botLink)).toHaveCount(0)
  await page.route('**/api/v1/auth/capabilities', route => route.fulfill({
    json: telegramOnly,
  }))
  await page.reload()
  await expect(page.getByText('Open TalentBay from its Telegram bot to sign in.')).toBeVisible()
  await expect(page.getByRole('link', botLink)).toHaveCount(0)
})

for (const [status, message] of [
  [401, 'Telegram sign-in did not complete. Close this Mini App and open it again from the bot.'],
  [409, 'Manage your sign-in methods in Settings to connect this Telegram account.'],
] as const) {
  test(`native Telegram keeps its connecting and ${status} feedback instead of the browser exit`, async ({ page }) => {
    await page.route('**/api/v1/auth/capabilities', route => route.fulfill({ json: { ...telegramOnly, telegramBotUrl: botUrl } }))
    await page.addInitScript(() => { window.Telegram = { WebApp: { initData: 'fixture', ready: () => {} } } })
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    await page.route('**/api/v1/auth/telegram', async (route) => {
      await held
      await route.fulfill({ status, json: { statusCode: status } })
    })
    try {
      await page.goto('/profile')
      await expect(page.getByText('Signing in with Telegram', { exact: true })).toBeVisible()
      await expect(page.getByRole('link', botLink)).toHaveCount(0)
    } finally { release() }
    await expect(page.getByText(message, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', botLink)).toHaveCount(0)
  })
}
