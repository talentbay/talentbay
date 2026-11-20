import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { vacancyCsvColumns } from '../../shared/types/vacancy-import'
import type { VacancyCsvColumn } from '../../shared/types/vacancy-import'
import { signedLaunch } from './support/telegram'

const origin = 'http://127.0.0.1:3129'
const key = randomUUID().slice(0, 8)
const slug = `pilot-role-${key}`, companySlug = `pilot-works-${key}`
const company = `Pilot Works ${key}`, title = `Pilot Engineer ${key}`
const candidateName = `Pilot Candidate ${key}`, contact = `@pilot_${key}`
const source = `Synthetic pilot ${key}`, note = `Internal review ${key}`, reference = `Internal contact ${key}`
const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const users = new Set<number>()

function vacancyFile() {
  const row: Partial<Record<VacancyCsvColumn, string>> = {
    source_name: source, source_external_id: key, source_url: `https://pilot.invalid/${slug}`,
    company_name: company, company_slug: companySlug, vacancy_slug: slug, title,
    description: 'Synthetic acceptance fixture, not a hiring offer.',
    employment_type: 'FULL_TIME', workplace_type: 'ONSITE', country_code: 'GB', city: 'London',
    salary_min: '50000', salary_max: '70000', salary_currency: 'GBP', salary_period: 'YEAR',
    relocation_offered: 'true', visa_sponsorship: 'false',
  }
  const line = vacancyCsvColumns.map(field => `"${(row[field] ?? '').replaceAll('"', '""')}"`).join(',')
  return { name: 'pilot.csv', mimeType: 'text/csv', buffer: Buffer.from(`${vacancyCsvColumns.join(',')}\n${line}\n`) }
}

async function signIn(context: BrowserContext, subject: number, name: string) {
  const response = await context.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(subject, name) } })
  expect(response.status()).toBe(200)
  const { user } = await response.json()
  users.add(user.id)
  return user.id as number
}

test.afterAll(async () => {
  try {
    await sql.begin(async tx => {
      await tx`delete from vacancies where slug=${slug} and source_name=${source}`
      await tx`delete from organisations where slug=${companySlug}`
      if (users.size) await tx`delete from users where id in ${tx([...users])}`
    })
  } finally { await sql.end() }
})

test('first employer pilot: reviewed CSV to candidate receipt and recorded company contact', async ({ browser, context, page: candidate }) => {
  test.slow()
  const operatorContext = await browser.newContext({ baseURL: origin })
  try {
    // Deny off-site browser traffic; no local request is intercepted or fulfilled.
    for (const actor of [context, operatorContext]) {
      await actor.route(url => /^https?:$/.test(url.protocol) && url.origin !== origin, route => route.abort('blockedbyclient'))
    }
    const subject = randomInt(1e9, 1e12)
    await signIn(context, subject, candidateName)
    const operatorName = `Pilot Operator ${key}`
    const operatorID = await signIn(operatorContext, subject + 1, operatorName)
    await sql`update users set role='ADMIN' where id=${operatorID}`
    await signIn(operatorContext, subject + 1, operatorName)
    const operator = await operatorContext.newPage()
    await candidate.setViewportSize({ width: 390, height: 844 })
    const search = async () => {
      await candidate.goto('/jobs')
      const input = candidate.getByRole('textbox', { name: 'Search vacancies' })
      await input.fill(title)
      await input.press('Enter')
      await expect(candidate).toHaveURL(url => url.searchParams.get('q') === title)
    }
    const listing = candidate.getByRole('link', { name: title, exact: true })

    await test.step('Import one draft; confirm it is private', async () => {
      await operator.goto('/ktulhu/v1/import')
      await operator.getByLabel('Vacancy CSV file').setInputFiles(vacancyFile())
      await operator.getByRole('button', { name: 'Validate file' }).click()
      const preview = operator.getByRole('region', { name: 'Preview records' }).getByRole('row').filter({ hasText: title })
      await expect(preview).toContainText(company)
      await expect(preview).toContainText('CREATED')
      await operator.getByRole('button', { name: 'Confirm import' }).click()
      await expect(operator.getByText('Import complete', { exact: true })).toBeVisible()
      await search()
      await expect(candidate.getByRole('heading', { name: 'No matching vacancies' })).toBeVisible()
      await expect(listing).toHaveCount(0)
      expect((await candidate.goto(`/jobs/${slug}`))?.status()).toBe(404)
    })

    await test.step('Review and publish the imported role', async () => {
      await operator.getByRole('link', { name: 'Open review queue' }).click()
      await operator.getByRole('row').filter({ hasText: title }).getByRole('button', { name: 'Review', exact: true }).click()
      const review = operator.getByRole('dialog')
      await expect(review.getByText('DRAFT', { exact: true })).toBeVisible()
      await expect(review.getByText('UNREVIEWED', { exact: true })).toBeVisible()
      const publish = review.getByRole('button', { name: 'Verify & publish' })
      await expect(publish).toBeDisabled()
      await review.getByRole('checkbox', { name: 'I checked the content, source and permission to publish.' }).check()
      await publish.click()
      await expect(review).not.toBeVisible()
    })

    await test.step('Find the role and inspect its illustrative London estimate', async () => {
      await search()
      await listing.click()
      await expect(candidate).toHaveURL(`${origin}/jobs/${slug}`)
      await expect(candidate.getByRole('heading', { level: 1 })).toHaveText(title)
      await candidate.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
      const estimate = candidate.getByRole('dialog', { name: 'Relocation estimate' })
      await expect(estimate).toContainText(`${title} · ${company}`)
      await expect(estimate.getByRole('combobox', { name: 'Destination' })).toContainText('London, GB')
      await expect(estimate.getByText('Demo data', { exact: true })).toBeVisible()
      await expect(estimate.getByRole('spinbutton', { name: 'Annual gross salary' })).toHaveValue('60000')
      await expect(estimate.getByRole('region', { name: 'Disposable income' })).toContainText('£150')
      await estimate.getByText('Data and assumptions', { exact: true }).click()
      await expect(estimate.getByText('No reviewed source data. Figures are illustrative.')).toBeVisible()
      await estimate.getByRole('button', { name: 'Close', exact: true }).click()
    })

    const applicationID: number = await test.step('Save a contact, consent and obtain a TalentBay receipt', async () => {
      await candidate.getByRole('button', { name: 'Apply', exact: true }).click()
      const apply = candidate.getByRole('dialog', { name: `Apply for ${title}` })
      const submit = apply.getByRole('button', { name: 'Submit application' })
      await expect(submit).toBeDisabled()
      await apply.getByRole('button', { name: 'Review your profile' }).click()
      const editor = candidate.getByRole('dialog', { name: 'Edit profile' })
      await editor.getByLabel('Telegram', { exact: true }).fill(contact)
      await editor.getByRole('button', { name: 'Save profile' }).click()
      await expect(apply.getByText(contact, { exact: true })).toBeVisible()
      await expect(apply).toContainText('Your current profile and cover note go to the TalentBay team, not directly to the employer.')
      const consent = apply.getByRole('checkbox', { name: `I ask TalentBay to contact ${company} and share this application with them for this role.` })
      await expect(consent).not.toBeChecked()
      await expect(submit).toBeDisabled()
      await consent.check()
      const receipt = candidate.waitForResponse(r => r.request().method() === 'POST' && /\/api\/v1\/vacancies\/\d+\/applications$/.test(new URL(r.url()).pathname))
      await submit.click()
      const response = await receipt
      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body).toMatchObject({ id: expect.any(Number), status: 'NEW' })
      await expect(candidate.getByText('Application received by TalentBay', { exact: true })).toBeVisible()
      await expect(candidate.getByText("Track our team's review in Applications. You'll see when we record contact with the company.", { exact: true })).toBeVisible()
      return body.id
    })

    await test.step('Take, start and record company contact', async () => {
      await operator.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Applications' }).click()
      await operator.getByRole('button', { name: `Review ${candidateName} for ${title}`, exact: true }).click()
      await expect(operator).toHaveURL(url => url.searchParams.get('review') === String(applicationID))
      const review = operator.getByRole('dialog', { name: 'Review application' })
      await expect(review.getByRole('region', { name: 'Submitted candidate profile' })).toContainText(contact)
      await review.getByRole('button', { name: 'Take application' }).click()
      await expect(review.getByText('Assigned to you', { exact: true })).toBeVisible()
      const action = review.getByRole('combobox', { name: 'Next action' })
      await expect(action).toContainText('Start handling')
      await review.getByLabel('Private operator note').fill(note)
      await review.getByRole('button', { name: 'Record action', exact: true }).click()
      const journal = review.getByRole('region', { name: 'Operator journal' })
      await expect(journal.getByText(note, { exact: true })).toBeVisible()
      await action.click()
      await operator.getByRole('option', { name: 'Record company contact', exact: true }).click()
      await review.getByLabel('Private reference', { exact: true }).fill(reference)
      await review.getByRole('button', { name: 'Record action', exact: true }).click()
      await expect(journal.getByRole('listitem').filter({ hasText: reference })).toContainText('Company contact recorded')
    })

    await test.step('Read public progress, not the private journal or a delivery claim', async () => {
      const viewReceipt = candidate.getByRole('link', { name: 'View application', exact: true })
      await expect(viewReceipt).toHaveAttribute('href', `/applications?receipt=${applicationID}`)
      const receiptResponse = candidate.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/applications/${applicationID}`)
      const progressResponse = candidate.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/applications/${applicationID}/progress`)
      await viewReceipt.click()
      const receipt = await receiptResponse
      expect(receipt.status()).toBe(200)
      expect(await receipt.headerValue('cache-control')).toContain('no-store')
      expect(await receipt.json()).toEqual({
        id: applicationID, status: 'NEW', coverLetter: null, createdAt: expect.any(String),
        handling: { stage: 'CONTACTED' }, publicVacancySlug: slug,
        vacancy: { slug, title, companyName: company, city: 'London', countryCode: 'GB' },
      })
      await expect(candidate).toHaveURL(url => url.pathname === '/applications' && url.searchParams.get('receipt') === String(applicationID))
      const detail = candidate.getByRole('dialog', { name: title, exact: true })
      await expect(detail).toContainText(company)
      const history = detail.getByRole('region', { name: 'Application progress' }).getByRole('list')
      for (const fact of ['Received by TalentBay', 'TalentBay started reviewing', 'Company contact recorded']) {
        await expect(history.getByText(fact, { exact: true })).toBeVisible()
      }
      const response = await progressResponse
      expect(response.status()).toBe(200)
      const progress = await response.json()
      expect(progress).toMatchObject({ id: applicationID, stage: 'CONTACTED', handoffRecorded: false })
      for (const privateText of [note, reference]) {
        expect(JSON.stringify(progress)).not.toContain(privateText)
        await expect(detail).not.toContainText(privateText)
      }
    })
  } finally { await operatorContext.close() }
})
