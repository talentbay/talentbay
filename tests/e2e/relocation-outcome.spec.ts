import { expect, test as base } from '@playwright/test'
import type { Locator, Page, Request } from '@playwright/test'

const isEstimate = (url: URL) => url.pathname === '/api/v1/relocation/preview'
const test = base.extend<{ estimates: Request[] }>({
  estimates: async ({ page }, use) => {
    const requests: Request[] = []
    page.on('request', req => { if (isEstimate(new URL(req.url()))) requests.push(req) })
    await use(requests)
    for (const req of requests) {
      expect(new URL(req.url()).search).toBe('')
      expect(req.method()).toBe('POST')
      expect(req.headers()['content-type']).toMatch(/^application\/json\b/i)
      expect(req.postDataJSON()).toEqual({ location: expect.any(String), annualGross: expect.any(Number) })
    }
  },
})

async function selectCity(tool: Locator, page: Page, name: string) {
  await tool.getByRole('combobox', { name: 'Destination' }).click()
  await page.getByRole('option', { name, exact: true }).click()
}

test('currency boundaries, delayed results and retry keep inputs and answers consistent', async ({ page, estimates }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/jobs')
  const tool = page.getByRole('complementary', { name: 'Relocation preview', exact: true })
  const income = tool.getByRole('spinbutton', { name: 'Annual gross salary' })
  const result = tool.getByRole('region', { name: 'Disposable income' })
  await income.fill('60000')
  await expect(result).toContainText('£150')
  await selectCity(tool, page, 'Berlin, DE · Demo')
  await expect(income).toHaveValue('')
  await expect(result).toHaveCount(0)
  await expect(tool.getByRole('status')).toContainText('Enter an annual amount in EUR.')
  await income.fill('60000')
  await expect(result).toContainText('€')
  await selectCity(tool, page, 'Lisbon, PT · Demo')
  await expect(income).toHaveValue('60000')
  await expect(result).toContainText('€1,550')

  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route(isEstimate, async (route) => {
    if (route.request().postDataJSON()?.annualGross === 10000) {
      await held
      await route.continue().catch(() => {})
    }
    else await route.continue()
  })
  const first = page.waitForRequest(req => isEstimate(new URL(req.url())) && req.postDataJSON()?.annualGross === 10000)
  try {
    await income.fill('10000')
    await expect(result).toHaveCount(0)
    await first
    await income.fill('120000')
    await expect(result).toContainText('€5,350')
  } finally { release() }
  const oldResponse = await (await first).response()
  if (oldResponse) await oldResponse.finished()
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  await expect(result).toContainText('€5,350')
  await page.unroute(isEstimate)

  await page.route(isEstimate, route => route.fulfill({ status: 503, body: '{}' }))
  await income.fill('90000')
  await expect(tool.getByText('The estimate could not be loaded.')).toBeVisible()
  await expect(result).toHaveCount(0)
  await expect(income).toHaveValue('90000')
  const retryBody = { location: 'lisbon', annualGross: 90000 }
  expect(estimates.at(-1)?.postDataJSON()).toEqual(retryBody)
  await page.unroute(isEstimate)
  const retry = page.waitForRequest(req => isEstimate(new URL(req.url())))
  await tool.getByRole('button', { name: 'Retry', exact: true }).click()
  expect((await retry).postDataJSON()).toEqual(retryBody)
  await expect(result).toContainText('€3,450')
  await income.fill('')
  await expect(result).toHaveCount(0)
  await expect(tool.getByText('Choose a destination and enter a yearly income in its currency to see an estimate.')).toBeVisible()
})

test('narrow calculator retains job/back context and the in-memory scenario, not a financial URL', async ({ page, estimates }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/jobs?countryCode=DE&q=Platform')
  await page.getByRole('link', { name: 'Platform Engineer', exact: true }).click()
  await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const tool = dialog.getByRole('complementary', { name: 'Relocation preview', exact: true })
  await expect(dialog).toContainText('Platform Engineer · Relay Systems')
  const vacancyURL = page.url()
  const income = tool.getByRole('spinbutton', { name: 'Annual gross salary' })
  await expect(income).toHaveValue('90000')
  const draft = '61357.42'
  await income.fill(draft)
  await expect(tool.getByRole('region', { name: 'Disposable income' })).toBeVisible()
  expect(estimates.at(-1)?.postDataJSON()).toEqual({ location: 'berlin', annualGross: Number(draft) })
  await tool.getByText('Data and assumptions', { exact: true }).press('Enter')
  await expect(tool.getByText('No reviewed source data. Figures are illustrative.')).toBeVisible()
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('relocation-dialog-320.png'), fullPage: true })
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Preview only', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
  await expect(income).toHaveValue(draft)
  expect(new URL(page.url()).searchParams.has('annualGross')).toBe(false)
  expect(page.url()).not.toContain(draft)
  expect(await page.evaluate(value => [localStorage, sessionStorage].some(storage =>
    Object.entries(storage).some(([key, item]) => key.includes(value) || String(item).includes(value)),
  ), draft)).toBe(false)
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Go back', exact: true }).click()
  await expect(page).toHaveURL(/countryCode=DE.*q=Platform|q=Platform.*countryCode=DE/)
  await page.goto(vacancyURL)
  await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
  await expect(income).toHaveValue('90000')
})
