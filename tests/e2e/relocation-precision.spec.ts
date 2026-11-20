import { expect, test } from '@playwright/test'
import type { Request } from '@playwright/test'

test('salary precision and range are field errors, not failed estimate requests', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 850 })
  const start = Date.now()
  await page.clock.install({ time: start })
  const requested: Request[] = []
  page.on('request', req => {
    const url = new URL(req.url())
    if (url.pathname === '/api/v1/relocation/preview') requested.push(req)
  })
  await page.goto('/jobs')
  const tool = page.getByRole('complementary', { name: 'Relocation preview' })
  const input = tool.getByRole('spinbutton', { name: 'Annual gross salary' })
  const result = tool.getByRole('region', { name: 'Disposable income' })
  await expect(input).toBeEnabled()
  await page.clock.pauseAt(start + 60_000)
  const debounceMs = 300
  for (const [value, message] of [
    ['60000.001', 'Use no more than two decimal places.'],
    ['-0.01', 'Enter an amount from 0 to 2,000,000.'],
    ['2000001', 'Enter an amount from 0 to 2,000,000.'],
  ] as const) {
    await input.fill(value)
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(tool.getByText(message, { exact: true })).toBeVisible()
    await page.clock.runFor(debounceMs + 100)
    await expect(input).toHaveValue(value)
    await expect(result).toHaveCount(0)
    expect(requested).toEqual([])
  }
  await input.fill('60000.01')
  await page.clock.runFor(debounceMs - 1)
  expect(requested).toEqual([])
  await page.clock.runFor(101)
  await expect(result).toBeVisible()
  await expect(input).not.toHaveAttribute('aria-invalid', 'true')
  await input.fill('')
  await page.clock.runFor(debounceMs + 100)
  await expect(result).toHaveCount(0)
  expect(requested).toHaveLength(1)
  await input.fill('0')
  await page.clock.runFor(debounceMs + 100)
  await expect(result).toContainText('Monthly shortfall')
  expect(requested.map(req => req.postDataJSON())).toEqual([
    { location: 'london', annualGross: 60000.01 }, { location: 'london', annualGross: 0 },
  ])
  for (const req of requested) {
    expect(req.method()).toBe('POST')
    expect(new URL(req.url()).search).toBe('')
  }
})
