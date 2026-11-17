import { expect, test } from '@playwright/test'

test('SSR relocation controls wait for hydration, then retain the first user input', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/_nuxt/**', async (route) => {
    if (new URL(route.request().url()).pathname.endsWith('.js')) await held
    await route.continue().catch(() => {})
  })
  const tool = page.getByRole('complementary', { name: 'Relocation preview', exact: true })
  const income = tool.getByRole('spinbutton', { name: 'Annual gross salary', exact: true })
  try {
    await page.goto('/jobs', { waitUntil: 'commit' })
    await expect(income).toBeVisible()
    await expect(income).toBeDisabled()
    await expect(tool.getByRole('combobox', { name: 'Destination', exact: true })).toBeDisabled()
  } finally { release() }
  await expect(income).toBeEnabled()
  await income.fill('60000')
  await expect(tool.getByRole('region', { name: 'Disposable income', exact: true })).toContainText('£150')
  await expect(income).toHaveValue('60000')
  const response = await page.request.get('/api/v1/relocation/preview?location=london&annualGross=60000')
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toBe('no-store')
})
