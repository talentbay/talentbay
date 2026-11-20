import { randomInt, randomUUID } from 'node:crypto'
import { expect, test as base } from '@playwright/test'
import type { Response } from '@playwright/test'
import postgres from 'postgres'
import { relocationMoney } from '../../app/utils/relocation-presentation'
import { setFixtureProfile } from './support/application'
import { signedLaunch } from './support/telegram'

const origin = 'http://127.0.0.1:3129'
const preview = '/api/v1/relocation/preview'
const manual = '93641.27'
const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const test = base.extend<{ listing: { id: number; slug: string } }>({
  listing: async ({ context }, use) => {
    const slug = `refresh-pay-${randomUUID()}`
    let owner: number | undefined
    try {
      const login = await context.request.post('/api/v1/auth/telegram', {
        headers: { origin }, data: { initData: signedLaunch(randomInt(1e9, 1e12), 'Refresh Fixture') },
      })
      expect(login.status()).toBe(200)
      const { user } = await login.json()
      owner = user.id
      await setFixtureProfile(context.request, user.id, { telegram: '@refresh_fixture' })
      const [company] = await sql`insert into organisations(name,slug,status) values('Fictional Refresh Company',${slug},'ACTIVE') returning id`
      const [row] = await sql`insert into vacancies(organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code,city,salary_min,salary_max,salary_currency,salary_period)
        values(${company!.id},${slug},'Fictional Refresh Engineer','Synthetic original duties','PUBLISHED','VERIFIED','FULL_TIME','ONSITE','GB','London',60000,80000,'GBP','YEAR') returning id`
      await use({ id: row!.id, slug })
    } finally {
      if (owner) await sql`delete from users where id=${owner}`
      await sql`delete from vacancies where slug=${slug}`
      await sql`delete from organisations where slug=${slug}`
    }
  },
})
test.afterAll(() => sql.end())

for (const scenario of ['currency mismatch', 'updated GBP range', 'manual GBP draft', 'reopened mobile sheet'] as const) {
  test(`in-place listing reload reconciles the relocation estimate: ${scenario}`, async ({ page, listing }, testInfo) => {
    const mobile = scenario === 'reopened mobile sheet'
    const updatedRange = scenario === 'updated GBP range' || mobile
    const path = `/jobs/${listing.slug}`
    let salaryInURL = false
    const previews = new Map<number, Response>()
    page.on('request', req => {
      const url = new URL(req.url())
      if (url.href.includes(manual)) salaryInURL = true
      if (url.pathname !== preview) return
      expect.soft(req.method()).toBe('POST')
      expect.soft(url.search).toBe('')
    })
    page.on('response', res => {
      if (new URL(res.url()).pathname === preview && res.request().method() === 'POST')
        previews.set(res.request().postDataJSON()?.annualGross, res)
    })
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 })
    const openSheet = page.getByRole('button', { name: 'Relocation estimate', exact: true })
    const sheet = page.getByRole('dialog', { name: 'Relocation estimate', exact: true })
    const tool = (mobile ? sheet : page).getByRole('complementary', { name: 'Relocation preview', exact: true })
    const income = tool.getByRole('spinbutton', { name: 'Annual gross salary' })
    const outcome = tool.getByRole('region', { name: 'Disposable income' })
    async function expectEstimate(gross: number) {
      await expect.poll(() => previews.get(gross)?.status()).toBe(200)
      const estimate = await previews.get(gross)!.json()
      expect(estimate.annualGross).toBe(gross)
      await expect(outcome).toContainText(relocationMoney(estimate.monthly.disposable, 'GBP'))
    }
    await page.goto(path)
    if (mobile) await openSheet.click()
    await expect(income).toHaveValue('70000')
    await expect(tool.getByRole('region', { name: 'Monthly breakdown' })).toContainText('£5,833')
    await expect(outcome).toBeVisible()
    const originalResult = await outcome.innerText()
    if (mobile) {
      await sheet.getByRole('button', { name: 'Close', exact: true }).click()
      await expect(sheet).toBeHidden()
    }
    let navigations = 0
    page.on('request', req => { if (req.isNavigationRequest() && req.frame() === page.mainFrame()) navigations++ })
    if (scenario === 'manual GBP draft') {
      await income.fill(manual)
      await expectEstimate(Number(manual))
    }
    await page.getByRole('button', { name: 'Apply', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Apply for Fictional Refresh Engineer' })
    await dialog.getByRole('checkbox').check()
    if (scenario === 'currency mismatch') await sql`update vacancies set salary_currency='USD' where id=${listing.id}`
    else if (updatedRange) await sql`update vacancies set salary_min=80000,salary_max=100000 where id=${listing.id}`
    else await sql`update vacancies set description='Synthetic revised duties' where id=${listing.id}`

    const rejected = page.waitForResponse(res => new URL(res.url()).pathname === `/api/v1/vacancies/${listing.id}/applications` && res.request().method() === 'POST')
    await dialog.getByRole('button', { name: 'Submit application', exact: true }).click()
    expect((await rejected).status()).toBe(412)
    const reload = dialog.getByRole('button', { name: 'Reload listing', exact: true })
    const detail = page.waitForResponse(res => new URL(res.url()).pathname === `/api/v1/vacancies/${listing.slug}` && res.request().method() === 'GET')
    await reload.click()
    expect((await detail).status()).toBe(200)
    await expect(reload).toBeHidden()
    await expect(dialog.getByRole('checkbox')).not.toBeChecked()
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    if (mobile) await openSheet.click()

    if (scenario === 'currency mismatch') {
      await expect(income).toHaveValue('')
      await expect(outcome).toHaveCount(0)
    } else if (updatedRange) {
      await expect(income).toHaveValue('90000')
      await expectEstimate(90000)
      expect(await outcome.innerText()).not.toBe(originalResult)
      if (mobile) await page.screenshot({ path: testInfo.outputPath('relocation-reopened-390.png'), animations: 'disabled' })
    } else {
      await expect(income).toHaveValue(manual)
      await expectEstimate(Number(manual))
      expect(await page.evaluate(amount => [localStorage, sessionStorage].some(store =>
        Object.entries(store).some(([key, value]) => key.includes(amount) || value.includes(amount))), manual)).toBe(false)
    }
    await expect(page).toHaveURL(origin + path)
    expect(navigations).toBe(0)
    expect(salaryInURL).toBe(false)
  })
}
