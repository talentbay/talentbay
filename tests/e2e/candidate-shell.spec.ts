import { expect, test } from '@playwright/test'

for (const width of [320, 390, 768, 900, 1024, 1440]) {
  test(`candidate navigation and cards fit ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', (message) => {
      if (/hydration.*mismatch|mismatch.*hydration/i.test(message.text())) errors.push(message.text())
    })
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/jobs')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('article').first()).toBeVisible()
    const nav = page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true })
    await expect(nav).toHaveCount(1)
    await expect(nav.getByRole('link', { name: 'Saved', exact: true })).toBeVisible()
    const bounds = await nav.boundingBox()
    expect(bounds).not.toBeNull()
    if (width < 1024) {
      expect(bounds!.y).toBeGreaterThan(700)
      expect(Math.round(bounds!.y + bounds!.height)).toBe(900)
    }
    else expect(bounds!.y).toBeLessThan(30)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`jobs-${width}.png`), fullPage: true })
    for (const path of ['/saved', '/profile', '/applications', '/settings', '/jobs/senior-backend-engineer-london']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`${path.replaceAll('/', '-')}-${width}.png`), fullPage: true })
    }
    expect(errors).toEqual([])
  })
}

test('save, read, remove and undo stay on the same browser-local shortlist', async ({ page }) => {
  await page.goto('/jobs')
  const first = page.locator('article').first()
  const title = await first.getByRole('link').first().innerText()
  await first.getByRole('button', { name: 'Save vacancy', exact: true }).click()
  await expect(first.getByRole('button', { name: 'Remove saved vacancy' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true }).getByRole('link', { name: 'Saved', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Saved jobs', exact: true })).toBeVisible()
  await expect(page.locator('article').getByRole('link', { name: title, exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Remove saved vacancy' }).click()
  await expect(page.getByText('Your shortlist starts here')).toBeVisible()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('article')).toHaveCount(1)
})

test('a failed resolve request does not remove saved slugs', async ({ page }) => {
  await page.goto('/jobs')
  await page.locator('article').first().getByRole('button', { name: 'Save vacancy', exact: true }).click()
  const before = await page.evaluate(() => localStorage.getItem('talentbay:saved-vacancies'))
  await page.route('**/api/v1/vacancies/resolve', route => route.fulfill({ status: 503, body: '{}' }))
  await page.goto('/saved')
  await expect(page.getByText('Saved jobs could not be refreshed')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('talentbay:saved-vacancies'))).toBe(before)
  await page.unroute('**/api/v1/vacancies/resolve')
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.locator('article')).toHaveCount(1)
})

test('an unavailable saved record stays removable and can be restored', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('talentbay:saved-vacancies', JSON.stringify(['no-longer-published'])))
  await page.goto('/saved')
  await expect(page.getByText('This vacancy is no longer available')).toBeVisible()
  await page.getByRole('button', { name: 'Remove unavailable vacancy' }).click()
  await expect(page.getByText('Your shortlist starts here')).toBeVisible()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByText('This vacancy is no longer available')).toBeVisible()
})

test('query filters and search survive a vacancy round trip', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/jobs?countryCode=DE&q=Platform')
  await expect(page.locator('article')).toHaveCount(1)
  await page.locator('article').getByRole('link', { name: 'Platform Engineer' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Platform Engineer')
  await page.getByRole('button', { name: 'Go back', exact: true }).click()
  await expect(page).toHaveURL(/countryCode=DE.*q=Platform|q=Platform.*countryCode=DE/)
  await expect(page.getByRole('textbox', { name: 'Search vacancies' })).toHaveValue('Platform')
  await expect(page.locator('article')).toHaveCount(1)
})

test('filters are staged until Apply; cancelling leaves the results untouched', async ({ page }) => {
  await page.goto('/jobs')
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('checkbox', { name: 'Visa support' }).check()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.locator('article')).toHaveCount(5)
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await expect(dialog.getByRole('checkbox', { name: 'Visa support' })).not.toBeChecked()
  await dialog.getByRole('checkbox', { name: 'Visa support' }).check()
  await dialog.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page).toHaveURL(/visaSponsorship=true/)
  await expect(page.locator('article')).toHaveCount(3)
})

test('local settings persist and produce an explicit filtered search', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/settings')
  await page.getByRole('combobox', { name: 'Preferred location' }).click()
  await page.getByRole('option', { name: 'Germany', exact: true }).click()
  await page.getByRole('switch', { name: 'Visa sponsorship required' }).check()
  await page.getByRole('combobox', { name: 'Theme', exact: true }).click()
  await page.getByRole('option', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('settings-dark-320.png'), fullPage: true })
  await page.getByRole('link', { name: 'Browse with these defaults' }).click()
  await expect(page).toHaveURL(/countryCode=DE.*visaSponsorship=true/)
  await expect(page.locator('article')).toHaveCount(1)
  await page.goto('/settings')
  await expect(page.getByRole('combobox', { name: 'Preferred location' })).toContainText('Germany')
  await expect(page.getByRole('switch', { name: 'Visa sponsorship required' })).toBeChecked()
})

test('storage write failures keep new saves available for this session', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'talentbay:saved-vacancies') throw new DOMException('Quota exceeded', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await page.goto('/jobs')
  await page.locator('article').first().getByRole('button', { name: 'Save vacancy', exact: true }).click()
  await page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true }).getByRole('link', { name: 'Saved', exact: true }).click()
  await expect(page.locator('article')).toHaveCount(1)
  await expect(page.getByText(/This session only/)).toBeVisible()
})

test('a shortlist updates across browser tabs without duplicate state owners', async ({ page, context }) => {
  await page.goto('/jobs')
  const second = await context.newPage()
  await second.goto('/saved')
  await expect(second.getByText('Your shortlist starts here')).toBeVisible()
  await page.locator('article').first().getByRole('button', { name: 'Save vacancy', exact: true }).click()
  await expect(second.locator('article')).toHaveCount(1)
  await second.getByRole('button', { name: 'Remove saved vacancy' }).click()
  await expect(page.locator('article').first().getByRole('button', { name: 'Save vacancy', exact: true })).toHaveAttribute('aria-pressed', 'false')
})

test('candidate guest routes, keyboard search and icons work in the compiled app', async ({ page }) => {
  const failures: string[] = []
  page.on('response', response => { if (response.status() >= 500) failures.push(response.url()) })
  await page.goto('/jobs')
  const search = page.getByRole('textbox', { name: 'Search vacancies' })
  await search.fill('Platform')
  await search.press('Enter')
  await expect(page).toHaveURL(/q=Platform/)
  await expect(page.locator('article')).toHaveCount(2)
  await expect(page.getByRole('link', { name: 'Platform Engineer', exact: true })).toBeVisible()
  for (const [path, title] of [['/applications', 'Your applications'], ['/profile', 'Profile'], ['/settings', 'Settings']]) {
    await page.goto(path!)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title!)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  expect(failures).toEqual([])
})

test('missing vacancies retain a usable product shell and an exit to jobs', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  const response = await page.goto('/jobs/no-such-vacancy')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.getByRole('button', { name: 'Browse jobs', exact: true }).click()
  await expect(page).toHaveURL(/\/jobs$/)
  await expect(page.locator('article')).toHaveCount(5)
})
