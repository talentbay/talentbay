import { expect, test } from '@playwright/test'
import { demoVacancies } from '../../server/data/demo-catalog'

const botUrl = 'https://t.me/fixture_entry_bot'
const botLink = { name: 'Open Telegram bot', exact: true } as const
const telegramOnly = { google: false, github: false, telegram: true }

test('guest Profile opens the configured bot separately and leaves the browser signed out', async ({ page, context }) => {
  await page.route('**/api/v1/auth/capabilities', route => route.fulfill({
    json: { ...telegramOnly, telegramBotUrl: botUrl, telegramVacancyEntry: true },
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

for (const [scenario, enabled, hasContext] of [
  ['contextual entry', true, true], ['entry disabled', false, true], ['missing context', true, false],
  ['native failure after browsing', true, true], ['native failure from vacancy button', true, true],
] as const) {
  test(`guest vacancy Apply: ${scenario}`, async ({ page }, testInfo) => {
    const fixture = demoVacancies[0]!
    const id = 2_147_483_647
    const context = 'v1:' + 'abcd'.repeat(16)
    const start = `job_${id}_${'abcd'.repeat(6)}`
    const detailPath = `/api/v1/vacancies/${fixture.slug}`
    const pinned = scenario === 'native failure from vacancy button'
    const native = pinned || scenario === 'native failure after browsing'
    if (pinned) {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
    }
    await page.route('**/api/v1/auth/capabilities', route => route.fulfill({
      json: { ...telegramOnly, telegramBotUrl: botUrl, telegramVacancyEntry: enabled },
    }))
    await page.route(url => url.pathname === detailPath, route => {
      const entries = new URL(route.request().url()).searchParams.getAll('entry')
      if (entries.length && (entries.length !== 1 || entries[0] !== start)) {
        return route.fulfill({ status: 404, json: { statusMessage: 'Vacancy not found' } })
      }
      return route.fulfill({ json: { ...fixture, id, applicationContext: hasContext ? context : undefined, source: { ...fixture.source, status: 'VERIFIED' } } })
    })
    if (native) {
      await page.addInitScript(() => { window.Telegram = { WebApp: { initData: 'fixture', ready: () => {} } } })
      await page.route('**/api/v1/auth/telegram', route => route.fulfill({ status: 401, json: {} }))
    }
    await page.goto('/jobs')
    if (pinned) {
      await expect(page.getByText('Reference: TG-SIGNIN-401', { exact: true })).toBeVisible()
      const lookup = page.waitForResponse(res => {
        const url = new URL(res.url())
        return url.pathname === detailPath && url.searchParams.get('entry') === start
      })
      // A same-document Back exercises the pinned route with the mocked detail API, not SSR.
      await page.evaluate(destination => {
        const current = location.href
        history.replaceState(history.state, '', destination)
        history.pushState(null, '', current)
        history.back()
      }, `/jobs/${fixture.slug}?entry=${start}`)
      expect((await lookup).status()).toBe(200)
    } else await page.getByRole('link', { name: fixture.title, exact: true }).click()
    await page.getByRole('button', { name: 'Sign in to apply', exact: true }).click()
    const dialog = page.getByRole('dialog')
    if (native) {
      const alert = dialog.getByRole('alert')
      await expect(alert).toContainText(pinned
        ? 'Close this Mini App and use the vacancy button in the bot chat again.'
        : 'Close this Mini App and open TalentBay again from the bot.')
      if (!pinned) await expect(alert).not.toContainText('vacancy button')
      await expect(alert.getByText('Reference: TG-SIGNIN-401', { exact: true })).toBeVisible()
      await expect(alert.getByText(/Request ID:/)).toHaveCount(0)
      await expect(dialog.getByRole('link', { name: 'Settings', exact: true })).toHaveCount(0)
      await expect(dialog.getByRole('link', { name: /Telegram/ })).toHaveCount(0)
      if (pinned) {
        await page.screenshot({ path: testInfo.outputPath('telegram-recovery-390.png'), animations: 'disabled' })
      }
      return
    }
    const contextual = enabled && hasContext
    const link = dialog.getByRole('link', { name: contextual ? 'Open this role in Telegram' : 'Open Telegram bot', exact: true })
    await expect(link).toHaveAttribute('href', contextual ? `${botUrl}?start=${start}` : botUrl)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(dialog.getByText(/This browser stays signed out/)).toBeVisible()
    if (!contextual) await expect(dialog.getByText(/open this role/i)).toHaveCount(0)
  })
}

test('configured web OAuth takes precedence over the bot entry', async ({ page }) => {
  await page.route('**/api/v1/auth/capabilities', route => route.fulfill({
    json: { ...telegramOnly, github: true, telegramBotUrl: botUrl, telegramVacancyEntry: true },
  }))
  await page.goto('/profile')
  await expect(page.getByRole('button', { name: 'Continue with GitHub', exact: true })).toBeEnabled()
  await expect(page.getByRole('link', botLink)).toHaveCount(0)
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
  [401, 'You are not signed in to TalentBay.'],
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
