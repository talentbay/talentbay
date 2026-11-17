import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

async function selectCity(tool: Locator, page: Page, name: string) {
  await tool.getByRole('combobox', { name: 'Destination' }).click()
  await page.getByRole('option', { name, exact: true }).click()
}

test('currency boundaries, delayed results and retry keep inputs and answers consistent', async ({ page }) => {
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
  await page.route('**/api/v1/relocation/preview?**', async (route) => {
    if (new URL(route.request().url()).searchParams.get('annualGross') === '10000') {
      await held
      await route.continue().catch(() => {})
    }
    else await route.continue()
  })
  const first = page.waitForRequest(request => request.url().includes('/relocation/preview?') && request.url().includes('annualGross=10000'))
  await income.fill('10000')
  await expect(result).toHaveCount(0)
  await first
  await income.fill('120000')
  await expect(result).toContainText('€5,350')
  release()
  await expect(result).toContainText('€5,350')
  await page.unroute('**/api/v1/relocation/preview?**')

  await page.route('**/api/v1/relocation/preview?**', route => route.fulfill({ status: 503, body: '{}' }))
  await income.fill('90000')
  await expect(tool.getByText('The estimate could not be loaded.')).toBeVisible()
  await expect(result).toHaveCount(0)
  await expect(income).toHaveValue('90000')
  await page.unroute('**/api/v1/relocation/preview?**')
  await tool.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(result).toContainText('€3,450')
  await income.fill('')
  await expect(result).toHaveCount(0)
  await expect(tool.getByText('Choose a destination and enter a yearly income in its currency to see an estimate.')).toBeVisible()
})

test('narrow calculator retains job/back context and the in-memory scenario, not a financial URL', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/jobs?countryCode=DE&q=Platform')
  await page.getByRole('link', { name: 'Platform Engineer', exact: true }).click()
  await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const tool = dialog.getByRole('complementary', { name: 'Relocation preview', exact: true })
  await expect(dialog).toContainText('Platform Engineer · Relay Systems')
  await tool.getByRole('spinbutton', { name: 'Annual gross salary' }).fill('60000')
  await expect(tool.getByRole('region', { name: 'Disposable income' })).toBeVisible()
  await tool.getByText('Data and assumptions', { exact: true }).press('Enter')
  await expect(tool.getByText('No reviewed source data. Figures are illustrative.')).toBeVisible()
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('relocation-dialog-320.png'), fullPage: true })
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Preview only', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
  await expect(dialog.getByRole('spinbutton', { name: 'Annual gross salary' })).toHaveValue('60000')
  expect(new URL(page.url()).searchParams.has('annualGross')).toBe(false)
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Go back', exact: true }).click()
  await expect(page).toHaveURL(/countryCode=DE.*q=Platform|q=Platform.*countryCode=DE/)
})
