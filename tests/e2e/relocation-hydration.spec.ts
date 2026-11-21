import { expect, test } from '@playwright/test'
import type { Request } from '@playwright/test'

for (const scenario of [
  { path: '/jobs', initial: '', amount: 60000, result: '£150' },
  { path: '/jobs/senior-backend-engineer-london', initial: '110000', amount: 110000, result: '£3,067' },
]) {
  test(`SSR controls on ${scenario.path} defer the estimate to a browser POST`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    const requests: Request[] = []
    const hydrationWarnings: string[] = []
    page.on('request', req => { if (new URL(req.url()).pathname === '/api/v1/relocation/preview') requests.push(req) })
    page.on('console', message => {
      if (/hydration.*mismatch|mismatch.*hydration/i.test(message.text())) hydrationWarnings.push(message.text())
    })
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    await page.route('**/_nuxt/**', async (route) => {
      if (new URL(route.request().url()).pathname.endsWith('.js')) await held
      await route.continue().catch(() => {})
    })
    const tool = page.getByRole('complementary', { name: 'Relocation preview', exact: true })
    const income = tool.getByRole('spinbutton', { name: 'Annual gross salary', exact: true })
    const result = tool.getByRole('region', { name: 'Disposable income', exact: true })
    try {
      await page.goto(scenario.path, { waitUntil: 'commit' })
      await expect(income).toBeVisible()
      await expect(income).toHaveValue(scenario.initial)
      await expect(income).toBeDisabled()
      await expect(tool.getByRole('combobox', { name: 'Destination', exact: true })).toBeDisabled()
      await expect(result).toHaveCount(0)
      if (scenario.initial) await expect(tool.getByRole('status', { name: 'Updating estimate' })).toBeVisible()
      await expect(tool.getByText('The estimate could not be loaded.')).toHaveCount(0)
      expect(requests).toHaveLength(0)
    } finally { release() }
    await expect(income).toBeEnabled()
    if (scenario.initial === '') await income.fill(String(scenario.amount))
    await expect(result).toContainText(scenario.result)
    await expect(income).toHaveValue(String(scenario.amount))
    expect(requests).toHaveLength(1)
    const estimate = requests[0]!
    expect(estimate.method()).toBe('POST')
    expect(estimate.url()).toBe(new URL('/api/v1/relocation/preview', page.url()).href)
    expect(await estimate.headerValue('origin')).toBe(new URL(page.url()).origin)
    expect(estimate.postDataJSON()).toEqual({ location: 'london', annualGross: scenario.amount })
    expect(hydrationWarnings).toEqual([])
  })
}

test('the compatibility GET estimate is not cached', async ({ request }) => {
  const response = await request.get('/api/v1/relocation/preview?location=london&annualGross=60000')
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toBe('no-store')
})
