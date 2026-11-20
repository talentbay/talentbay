import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'

test('Escape restores the second receipt View button; opening the vacancy does not', async ({ page, context }) => {
  const login = await context.request.post('/api/v1/auth/telegram', {
    headers: { origin: 'http://127.0.0.1:3129' },
    data: { initData: signedLaunch(randomInt(1e9, 1e12), 'Receipt focus candidate') },
  })
  expect(login.ok()).toBe(true)
  const { user } = await login.json()
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 })
  const suffix = randomUUID()
  let companyID: number | undefined
  try {
    const [company] = await sql`insert into organisations (name,slug,status) values ('Current public company',${suffix},'ACTIVE') returning id`
    companyID = company!.id as number
    const ids: number[] = []
    for (const prefix of ['older', 'newer']) {
      const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code)
        values (${companyID},${prefix + '-' + suffix},'Current public role','Synthetic role.','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','DE') returning id`
      const [receipt] = await sql`insert into applications (user_id,vacancy_id) values (${user.id},${vacancy!.id}) returning id`
      ids.push(receipt!.id)
    }
    await page.goto('/applications')
    const views = page.getByRole('button', { name: /^View application #/ })
    await expect(views).toHaveCount(2)
    const second = views.nth(1)
    await expect(second).toHaveAccessibleName(`View application #${ids[0]}`)
    await views.first().focus()
    await page.keyboard.press('Tab')
    await expect(second).toBeFocused()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: `Application #${ids[0]}`, exact: true })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Current public company')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(second).toBeFocused()

    await second.evaluate(button => button.addEventListener('focus', () => sessionStorage.setItem('receipt-refocused', 'yes')))
    await page.keyboard.press('Enter')
    await dialog.getByRole('link', { name: 'Open vacancy' }).press('Enter')
    await expect(page).toHaveURL(new RegExp(`/jobs/older-${suffix}$`))
    expect(await page.evaluate(() => sessionStorage.getItem('receipt-refocused'))).toBeNull()
  } finally {
    await sql`delete from users where id=${user.id}`
    if (companyID !== undefined) {
      await sql`delete from vacancies where organisation_id=${companyID}`
      await sql`delete from organisations where id=${companyID}`
    }
    await sql.end()
  }
})

test('the vacancy opens its own receipt even beyond page one; a different candidate cannot read it', async ({ browser, page, context }) => {
  const origin = 'http://127.0.0.1:3129'
  const outsider = await browser.newContext({ baseURL: origin })
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 })
  const users: number[] = []
  const key = randomUUID()
  const privateNote = `Private cover note ${key}`
  let companyId: number | undefined
  try {
    for (const session of [context, outsider]) {
      const response = await session.request.post('/api/v1/auth/telegram', {
        headers: { origin }, data: { initData: signedLaunch(randomInt(1e9, 1e12), 'Receipt link candidate') },
      })
      expect(response.ok()).toBe(true)
      users.push((await response.json()).user.id)
    }
    const [company] = await sql`insert into organisations (name,slug,status) values ('Synthetic employer',${key},'ACTIVE') returning id`
    companyId = company!.id as number
    const [oldest] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code)
      values (${companyId},${key},'First synthetic role','Synthetic vacancy.','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB') returning id`
    const [receipt] = await sql`insert into applications (user_id,vacancy_id,cover_letter) values (${users[0]!},${oldest!.id},${privateNote}) returning id`
    await sql`with newer as (
      insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code)
      select ${companyId},${key} || '-' || n,'Later role','Synthetic vacancy.','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB' from generate_series(1,25) n returning id
    ) insert into applications (user_id,vacancy_id) select ${users[0]!},id from newer`
    const id = receipt!.id as number
    const firstPage = await context.request.get('/api/v1/applications')
    expect(firstPage.ok()).toBe(true)
    const { items, nextCursor } = await firstPage.json()
    expect(items).toHaveLength(25)
    expect(items.map((i: { id: number }) => i.id)).not.toContain(id)
    expect(nextCursor).toBeTruthy()
    await page.goto(`/jobs/${key}`)
    const link = page.getByRole('link', { name: 'View application', exact: true })
    await expect(link).toHaveAttribute('href', `/applications?receipt=${id}`)
    await link.click()
    const dialog = page.getByRole('dialog', { name: `Application #${id}`, exact: true })
    await expect(dialog).toContainText(privateNote)
    await page.reload()
    await expect(dialog).toContainText(privateNote)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(page).toHaveURL(url => !url.searchParams.has('receipt'))

    const other = await outsider.newPage()
    const response = other.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/applications/${id}`)
    await other.goto(`/applications?receipt=${id}`)
    const denied = await response
    expect(denied.status()).toBe(404)
    expect(await denied.headerValue('cache-control')).toContain('no-store')
    expect(await denied.text()).not.toContain(privateNote)
    const unavailable = other.getByRole('dialog', { name: 'Application unavailable', exact: true })
    await expect(unavailable).toBeVisible()
    await expect(other.locator('body')).not.toContainText(privateNote)
    await unavailable.getByRole('button', { name: 'View all applications' }).click()
    await expect(other.getByRole('heading', { name: 'No applications yet' })).toBeVisible()
    await expect(other.getByRole('dialog')).toHaveCount(0)
    await expect(other.locator('body')).not.toContainText(privateNote)
  } finally {
    try {
      if (users.length) await sql`delete from users where id in ${sql(users)}`
      if (companyId !== undefined) {
        await sql`delete from vacancies where organisation_id=${companyId}`
        await sql`delete from organisations where id=${companyId}`
      }
    } finally { await sql.end(); await outsider.close() }
  }
})
