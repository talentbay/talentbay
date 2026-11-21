import { expect, test } from '@playwright/test'
import { encodeVacancyCursor, parseVacancySearch } from '../../server/services/vacancies/search-query'

const emptyCatalogue = { items: [], total: 0, dataStatus: 'VERIFIED', nextCursor: null }
const catalogueTitle = 'No vacancies are published right now'
const noMatches = 'No matching vacancies'
const exhausted = 'No more roles on this page'
const vacanciesAPI = /\/api\/v1\/vacancies(?:\?|$)/

for (const width of [320, 390, 1024]) {
  test(`empty published catalogue keeps Profile and standalone relocation reachable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    // Client navigation makes the vacancy fetch interceptable; a direct /jobs visit fetches on the server.
    await page.route(vacanciesAPI, route => route.fulfill({ json: emptyCatalogue }))
    await page.goto('/applications')
    const nav = page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true })
    await nav.getByRole('link', { name: 'Jobs', exact: true }).click()
    const empty = page.getByRole('heading', { name: catalogueTitle, exact: true })
    await expect(empty).toBeVisible()
    await expect(page.getByRole('heading', { name: '0 roles', exact: true })).toBeVisible()
    await expect(page.locator('article')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: noMatches })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Clear search and filters' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Apply', exact: true })).toHaveCount(0)
    await page.getByRole('textbox', { name: 'Search vacancies' }).fill('unsent draft')
    await expect(page).toHaveURL(/\/jobs$/)
    await expect(empty).toBeVisible()

    const opener = page.getByRole('button', { name: 'Relocation comparison', exact: true })
    const tool = page.getByRole('complementary', { name: 'Relocation preview', exact: true })
    if (width < 1024) {
      await expect(tool).toHaveCount(0)
      await opener.press('Enter')
      await expect(page.getByRole('dialog', { name: 'Relocation comparison' })).toBeVisible()
    } else {
      await expect(opener).toHaveCount(0)
    }
    const income = tool.getByRole('spinbutton', { name: 'Annual gross salary' })
    const result = tool.getByRole('region', { name: 'Disposable income' })
    await expect(income).toHaveValue('')
    await expect(result).toHaveCount(0)
    await income.fill('0')
    await expect(result).toContainText('Monthly shortfall')
    if (width < 1024) {
      await income.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(opener).toBeFocused()
    }

    const profile = page.getByRole('link', { name: 'Prepare your profile', exact: true })
    await expect(profile).toHaveAttribute('href', '/profile')
    await profile.scrollIntoViewIfNeeded()
    const box = (await profile.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    if (width < 1024) expect(box.y + box.height).toBeLessThanOrEqual((await nav.boundingBox())!.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await profile.click()
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
  })
}

for (const criteria of ['q=nonexistent-role', 'countryCode=FR', 'q=nonexistent-role&countryCode=FR&visaSponsorship=true&salaryDisclosed=true']) {
  test(`SSR distinguishes no matches and clears applied criteria: ${criteria}`, async ({ page }) => {
    const response = await page.goto(`/jobs?${criteria}`)
    expect(await response!.text()).toContain(noMatches)
    await expect(page.getByRole('heading', { name: noMatches, exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: catalogueTitle })).toHaveCount(0)
    const search = page.getByRole('textbox', { name: 'Search vacancies' })
    await search.fill('not submitted')
    await page.getByRole('link', { name: 'Clear search and filters' }).click()
    await expect(page).toHaveURL(/\/jobs$/)
    await expect(search).toHaveValue('')
    await expect(page.locator('article').first()).toBeVisible()
  })
}

test('an exhausted SSR page keeps the match count and restarts the same search', async ({ page }) => {
  const criteria = { q: 'Platform', countryCode: 'DE', limit: 50 }
  const before = encodeVacancyCursor(parseVacancySearch(criteria), { id: 1, date: null, salary: null })
  const response = await page.goto(`/jobs?q=Platform&countryCode=DE&before=${before}`)
  expect(await response!.text()).toContain(exhausted)
  await expect(page.getByRole('heading', { name: '1 role', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Clear search and filters' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Newest roles', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Platform Engineer', exact: true })).toBeVisible()
  const url = new URL(page.url())
  expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'Platform', countryCode: 'DE' })
  expect(url.hash).toBe('#results-title')
})

test('a pending or failed request never reports zero; Retry can recover to a genuine empty catalogue', async ({ page }) => {
  await page.goto('/jobs?q=nonexistent-role')
  await expect(page.getByRole('textbox', { name: 'Search vacancies' })).toBeEnabled()
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  let fail = true
  await page.route(vacanciesAPI, async route => {
    if (!fail) return route.fulfill({ json: emptyCatalogue })
    await held
    return route.fulfill({ status: 503, json: { statusMessage: 'Unavailable' } })
  })
  const zero = page.getByRole('heading', { name: '0 roles', exact: true })
  try {
    await page.getByRole('link', { name: 'Clear search and filters' }).click()
    await expect(page.getByRole('region', { name: 'Vacancy results' })).toHaveAttribute('aria-busy', 'true')
    await expect(zero).toHaveCount(0)
    await expect(page.getByRole('heading', { name: noMatches })).toHaveCount(0)
  } finally { release() }
  await expect(page.getByText('Vacancies unavailable', { exact: true })).toBeVisible()
  await expect(zero).toHaveCount(0)
  await expect(page.getByRole('heading', { name: catalogueTitle })).toHaveCount(0)
  fail = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('heading', { name: catalogueTitle })).toBeVisible()
  await expect(zero).toBeVisible()
  await expect(page.getByText('Vacancies unavailable', { exact: true })).toHaveCount(0)
})
