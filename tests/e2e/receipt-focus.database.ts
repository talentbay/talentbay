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
