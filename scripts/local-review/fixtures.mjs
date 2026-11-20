import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const roles = [
  { slug: 'senior-backend-engineer-london', title: 'Senior Backend Engineer', name: 'Atlas Video', companySlug: 'atlas-video', countryCode: 'GB', city: 'London', currency: 'GBP', min: 95000, max: 125000, skills: ['TypeScript', 'PostgreSQL', 'Node.js'], project: 'Design the processing queue for video uploads and make failed transcodes safe to retry.', relocationOffered: true, visaSponsorship: true },
  { slug: 'senior-frontend-engineer-amsterdam', title: 'Senior Frontend Engineer', name: 'Northstar Canvas', companySlug: 'northstar-canvas', countryCode: 'NL', city: 'Amsterdam', currency: 'EUR', min: 90000, max: 120000, skills: ['Vue', 'TypeScript', 'Accessibility'], project: 'Make a collaborative drawing editor usable with a keyboard and fast on large shared canvases.', relocationOffered: true, visaSponsorship: true },
  { slug: 'platform-engineer-berlin', title: 'Platform Engineer', name: 'Relay Systems', companySlug: 'relay-systems', countryCode: 'DE', city: 'Berlin', currency: 'EUR', min: 78000, max: 102000, skills: ['Kubernetes', 'Go', 'Observability'], project: 'Help product teams release services safely and trace failures from deployment back to the affected request.', relocationOffered: true, visaSponsorship: true },
  { slug: 'product-engineer-lisbon', title: 'Product Engineer', name: 'Harbor Finance', companySlug: 'harbor-finance', countryCode: 'PT', city: 'Lisbon', currency: 'EUR', min: 55000, max: 72000, skills: ['TypeScript', 'Vue', 'PostgreSQL'], project: 'Build a reconciliation screen where small businesses can match invoices to incoming payments.', relocationOffered: true, visaSponsorship: false },
  { slug: 'staff-fullstack-engineer-remote-emea', title: 'Staff Fullstack Engineer', name: 'Common Thread', companySlug: 'common-thread', countryCode: 'DE', city: 'Berlin', currency: 'EUR', min: 105000, max: 140000, skills: ['TypeScript', 'Vue', 'Node.js'], project: 'Design shared editing and conflict recovery for a distributed team working on the same documents.', remote: true, relocationOffered: false, visaSponsorship: false },
  { slug: 'data-engineer-amsterdam', title: 'Data Engineer', name: 'Northstar Canvas', companySlug: 'northstar-canvas', countryCode: 'NL', city: 'Amsterdam', currency: 'EUR', min: 80000, max: 100000, skills: ['Python', 'SQL', 'dbt'], project: 'Turn editor events into reliable daily metrics and build checks for missing or late batches.', relocationOffered: true, visaSponsorship: true },
  { slug: 'quality-engineer-tallinn', title: 'Quality Engineer', name: 'Clear Signal', companySlug: 'clear-signal', countryCode: 'EE', city: 'Tallinn', currency: 'EUR', min: 52000, max: 68000, skills: ['Playwright', 'TypeScript', 'Accessibility'], project: 'Build browser checks for an incident dashboard that remains usable by keyboard during live updates.', relocationOffered: true, visaSponsorship: true },
]

export const reviewVacancies = roles.map(({ slug, title, name, companySlug, countryCode, city, currency, min, max, skills, project, remote, relocationOffered, visaSponsorship }) => ({
  source: { name: 'Local review fixture (fictional)', url: `https://example.invalid/jobs/${slug}`, externalId: slug },
  company: { name, slug: companySlug },
  vacancy: {
    slug, title, countryCode, city, skills, seniority: title.startsWith('Staff ') ? 'Staff' : 'Senior',
    summary: `Demo vacancy. ${project}`,
    description: [
      'Demo vacancy. This employer and role are fictional. No application is sent to an employer.',
      `The role\n${project} Work with ${skills.join(', ')}.`,
      `Working arrangement\n${remote ? 'Remote within EMEA; Berlin is the team base.' : `Hybrid in ${city}, with two office days per week.`}`,
      `Moving support\n${relocationOffered ? 'Relocation allowance included.' : 'No relocation allowance.'} ${visaSponsorship ? 'Visa sponsorship included.' : 'No visa sponsorship.'}`,
    ].join('\n\n'),
    employmentType: 'FULL_TIME', workplaceType: remote ? 'REMOTE' : 'HYBRID',
    salary: { min, max, currency, period: 'YEAR' }, relocationOffered, visaSponsorship,
  },
}))

function vacancyCsvRow(item, columns) {
  const row = {
    source_name: item.source.name, source_url: item.source.url, source_external_id: item.source.externalId,
    company_name: item.company.name, company_slug: item.company.slug, vacancy_slug: item.vacancy.slug,
    title: item.vacancy.title, summary: item.vacancy.summary, description: item.vacancy.description,
    employment_type: item.vacancy.employmentType, workplace_type: item.vacancy.workplaceType,
    seniority: item.vacancy.seniority, country_code: item.vacancy.countryCode, city: item.vacancy.city,
    salary_min: item.vacancy.salary.min, salary_max: item.vacancy.salary.max,
    salary_currency: item.vacancy.salary.currency, salary_period: item.vacancy.salary.period, skills: item.vacancy.skills.join('|'),
    relocation_offered: item.vacancy.relocationOffered, visa_sponsorship: item.vacancy.visaSponsorship,
  }
  return columns.map(key => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(',')
}

export function vacanciesCsv(items) {
  const header = readFileSync(new URL('../../public/templates/vacancies.csv', import.meta.url), 'utf8').trim()
  const columns = header.split(',')
  return [header, ...items.map(item => vacancyCsvRow(item, columns))].join('\n') + '\n'
}

export function reviewCsv(item = reviewVacancies[5]) {
  return vacanciesCsv([item])
}

export async function seedReview({ sql, request, signIn, personas }) {
  const operator = await signIn(personas.admin)
  await sql`update users set role = 'ADMIN' where id = ${operator.user.id}`
  const admin = await signIn(personas.admin)
  const imported = await request('/api/v1/admin/vacancies/import', { method: 'POST', body: { items: [...reviewVacancies.slice(0, 5), reviewVacancies[6]] }, cookies: admin.cookies })
  for (const item of imported.items) {
    const record = await request(`/api/v1/admin/vacancies/${item.id}`, { cookies: admin.cookies })
    await request(`/api/v1/admin/vacancies/${item.id}`, {
      method: 'PATCH', cookies: admin.cookies,
      body: { status: 'PUBLISHED', reviewStatus: 'VERIFIED', revision: record.revision },
    })
  }
  const candidate = await signIn(personas.candidate)
  await signIn(personas.newcomer)
  const profile = await request('/api/v1/profile', {
    method: 'PUT', cookies: candidate.cookies, headers: { 'X-TalentBay-Profile-Owner': String(candidate.user.id) },
    body: { headline: 'Senior software engineer', about: 'Fictional candidate exploring international engineering roles. Interested in product teams, accessible interfaces and reliable services.', countryCode: 'PT', city: 'Porto', telegram: '@local_review_fixture', githubUrl: 'https://example.invalid/portfolio', linkedinUrl: null, phone: null },
  })
  const applications = []
  for (const item of imported.items.slice(1, 5)) {
    const vacancy = await request(`/api/v1/vacancies/${encodeURIComponent(item.slug)}`)
    applications.push(await request(`/api/v1/vacancies/${item.id}/applications`, { method: 'POST', cookies: candidate.cookies, body: { coverLetter: 'A fictional application for the local product review.', disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true, expectedContext: vacancy.applicationContext, expectedCandidateContext: profile.candidateContext } }))
  }
  const command = async (id, revision, action, extra = {}) => request(`/api/v1/admin/applications/${id}/handling`, {
    method: 'POST', cookies: admin.cookies, body: { action, expectedRevision: revision, commandKey: randomUUID(), ...extra },
  })
  for (const application of applications.slice(1)) {
    await command(application.id, 1, 'ASSIGN', { assigneeID: admin.user.id })
    await command(application.id, 2, 'START')
  }
  const shared = applications[2]
  const contact = { channel: 'OTHER', occurredAt: new Date().toISOString(), reference: 'Synthetic local simulation only; no external company contacted.' }
  await command(shared.id, 3, 'CONTACT', contact)
  await command(shared.id, 4, 'SHARE', { ...contact, confirmCompleted: true })
  await command(applications[3].id, 3, 'CLOSE', { reason: 'CONTACT_UNAVAILABLE', privateNote: 'Synthetic closed example, not an employer rejection.' })
  // This explicitly legacy fixture must never receive invented consent or a snapshot.
  await sql`insert into applications (user_id,vacancy_id,cover_letter) values (${candidate.user.id},${imported.items[5].id},'Legacy synthetic application; no submission snapshot.')`
}
