import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const token = `Page${randomUUID().replaceAll('-', '')}`
const slug = token.toLowerCase()
let companyID: number
test.beforeAll(async () => {
  const [company] = await sql`insert into organisations (name,slug,status) values ('Fictional Pagination Company',${slug},'ACTIVE') returning id`
  companyID = company!.id
  await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code,published_at,source_name)
    select ${companyID},${slug}||'-'||n,${token}||' Fictional Engineer '||n,'Fictional browser pagination dataset; no real company or hiring offer.',
    'PUBLISHED','VERIFIED','FULL_TIME','REMOTE','DE','2026-10-27T00:00:00.123456Z'::timestamptz,'Fictional pagination fixture'
    from generate_series(1,111) n`
})
test.afterAll(async () => {
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  await sql.end()
})

test('SSR first page → older pages → detail/back preserves query, cursor and scroll; filters reset cursor', async ({ page, context }, testInfo) => {
  const url = `/jobs?q=${token}&countryCode=DE`
  const response = await context.request.get(url)
  const html = await response.text()
  expect(response.status()).toBe(200)
  expect(html).toContain(`${token} Fictional Engineer 111`)
  expect(html).not.toContain(`${token} Fictional Engineer 61`)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(url)
  await expect(page.locator('article')).toHaveCount(50)
  const first = await page.locator('article a').allTextContents()
  await page.getByRole('link', { name: 'Older roles', exact: true }).click()
  await expect(page).toHaveURL(/before=.+#results-title$/)
  await expect(page.locator('article a').first()).toHaveText(`${token} Fictional Engineer 61`)
  const second = await page.locator('article a').allTextContents()
  expect(second).toHaveLength(50)
  expect(second.some(title => first.includes(title))).toBe(false)
  const pageTwoUrl = page.url()
  const middle = page.locator('article a').nth(10)
  await middle.scrollIntoViewIfNeeded()
  const position = await page.evaluate(() => window.scrollY)
  await middle.click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fictional Engineer')
  await page.getByRole('button', { name: 'Back to jobs', exact: true }).click()
  await expect(page).toHaveURL(pageTwoUrl)
  await expect(page.locator('article a').first()).toHaveText(`${token} Fictional Engineer 61`)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(position - 60)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(position + 60)
  await page.getByRole('link', { name: 'Older roles', exact: true }).click()
  await expect(page.locator('article')).toHaveCount(11)
  await expect(page.getByRole('link', { name: 'Older roles', exact: true })).toHaveCount(0)
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('link', { name: 'Newest roles', exact: true }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath(`vacancy-pages-${width}.png`) })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('link', { name: 'Newest roles', exact: true }).click()
  await expect(page).not.toHaveURL(/before=/)
  await expect(page.locator('article a').first()).toHaveText(`${token} Fictional Engineer 111`)
  await page.getByRole('link', { name: 'Older roles', exact: true }).click()
  await expect(page.locator('article a').first()).toHaveText(`${token} Fictional Engineer 61`)
  await page.getByRole('button', { name: 'Remove Germany filter' }).click()
  await expect(page).not.toHaveURL(/before=/)
  await expect(page.locator('article a').first()).toHaveText(`${token} Fictional Engineer 111`)
  expect(errors).toEqual([])
})

test('card opens from its padding in Jobs and Saved; bookmark and keyboard remain independent @mobile-pilot', async ({ page, isMobile }) => {
  const path = '/jobs?q=' + token
  await page.goto(path)
  const card = page.locator('article').first()
  const link = card.getByRole('link')
  const target = await link.getAttribute('href')
  const title = await link.innerText()
  expect(target).toMatch(/^\/jobs\/.+/)
  const save = card.getByRole('button', { name: 'Save vacancy', exact: true })
  await save.click()
  await expect(card.getByRole('button', { name: 'Remove saved vacancy' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(url => url.pathname === '/jobs')
  const openFromPadding = async () => {
    await card.scrollIntoViewIfNeeded()
    const textTargets = await card.locator('p').evaluateAll(paragraphs =>
      paragraphs.filter(p => p.textContent?.trim()).map(p => {
        const r = p.getBoundingClientRect()
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('a')?.getAttribute('href')
      }),
    )
    expect(textTargets.length).toBeGreaterThan(1)
    expect(textTargets.every(href => href === target)).toBe(true)
    const position = { x: 8, y: 8 }
    if (isMobile) await card.tap({ position })
    else await card.click({ position })
    await expect(page).toHaveURL(url => url.pathname === target)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  }
  await openFromPadding()
  await page.goto('/saved')
  await expect(link).toHaveAttribute('href', target!)
  await openFromPadding()
  await page.goto('/saved')
  const remove = card.getByRole('button', { name: 'Remove saved vacancy' })
  if (isMobile) {
    await remove.tap()
  } else {
    await link.focus()
    await page.keyboard.press('Tab')
    await expect(remove).toBeFocused()
    await page.keyboard.press('Space')
  }
  await expect(page.getByText('Your shortlist starts here', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(url => url.pathname === '/saved')
})

test('invalid public query/cursor has a restart path instead of silently resetting results', async ({ page, context }) => {
  for (const query of ['limit=51', 'limit=0', 'sort=salary-desc', 'before=bad', `before=${'x'.repeat(513)}`]) {
    expect((await context.request.get(`/api/v1/vacancies?${query}`)).status()).toBe(400)
  }
  await page.goto(`/jobs?q=${token}&before=bad`)
  await expect(page.getByText('Vacancies unavailable', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Newest roles', exact: true }).click()
  await expect(page.locator('article')).toHaveCount(50)
  await expect(page.getByText('Vacancies unavailable', { exact: true })).toHaveCount(0)
})

test('candidate selects an exact company, combines filters and clears it from a later page @mobile-pilot', async ({ page }, testInfo) => {
  await page.goto('/jobs?q=' + token)
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await page.getByRole('button', { name: 'Filter by company' }).click()
  await page.getByPlaceholder('Search companies').fill(slug)
  const option = page.getByRole('option').filter({ hasText: slug })
  await expect(option).toContainText('Fictional Pagination Company')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('public-company-filter.png') })
  await option.click()
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page).toHaveURL(new RegExp('company=' + slug))
  await expect(page.getByRole('heading', { name: '111 roles' })).toBeVisible()
  await page.getByRole('link', { name: 'Older roles' }).click()
  await expect(page.locator('article a').first()).toHaveText(token+' Fictional Engineer 61')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Remove company filter: Fictional Pagination Company' })).toBeVisible()
  await page.getByRole('button', { name: /Filters.*active/ }).click()
  await page.getByRole('checkbox', { name: 'Visa support' }).check()
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page.getByText('No matching vacancies', { exact: true })).toBeVisible()
  await expect(page).not.toHaveURL(/before=/)
  await expect(page).toHaveURL(new RegExp('company=' + slug))
  await page.getByRole('button', { name: 'Remove visa support filter' }).click()
  await expect(page.getByRole('heading', { name: '111 roles' })).toBeVisible()
  await page.getByRole('link', { name: 'Older roles' }).click()
  await page.getByRole('button', { name: /^Remove company filter:/ }).click()
  await expect(page).not.toHaveURL(/company=|before=/)
  await expect(page.getByRole('textbox', { name: 'Search vacancies' })).toHaveValue(token)
})
