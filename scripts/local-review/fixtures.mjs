import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const roles = [
  ['senior-backend-engineer-london', 'Senior Backend Engineer', 'Atlas Video', 'atlas-video', 'GB', 'London', 'GBP', 95000, 125000, ['TypeScript', 'PostgreSQL', 'Node.js']],
  ['senior-frontend-engineer-amsterdam', 'Senior Frontend Engineer', 'Northstar Canvas', 'northstar-canvas', 'NL', 'Amsterdam', 'EUR', 90000, 120000, ['Vue', 'TypeScript', 'Accessibility']],
  ['platform-engineer-berlin', 'Platform Engineer', 'Relay Systems', 'relay-systems', 'DE', 'Berlin', 'EUR', 78000, 102000, ['Kubernetes', 'Go', 'Observability']],
  ['product-engineer-lisbon', 'Product Engineer', 'Harbor Finance', 'harbor-finance', 'PT', 'Lisbon', 'EUR', 55000, 72000, ['TypeScript', 'Vue', 'PostgreSQL']],
  ['staff-fullstack-engineer-remote-emea', 'Staff Fullstack Engineer', 'Common Thread', 'common-thread', 'DE', 'Berlin', 'EUR', 105000, 140000, ['TypeScript', 'Vue', 'Node.js']],
  ['data-engineer-amsterdam', 'Data Engineer', 'Northstar Canvas', 'northstar-canvas', 'NL', 'Amsterdam', 'EUR', 80000, 100000, ['Python', 'SQL', 'dbt']],
  ['quality-engineer-tallinn', 'Quality Engineer', 'Clear Signal', 'clear-signal', 'EE', 'Tallinn', 'EUR', 52000, 68000, ['Playwright', 'TypeScript', 'Accessibility']],
]

export const reviewVacancies = roles.map(([slug, title, name, companySlug, countryCode, city, currency, min, max, skills], index) => ({
  source: { name: 'Local review fixture (fictional)', url: `https://example.invalid/jobs/${slug}`, externalId: slug },
  company: { name, slug: companySlug },
  vacancy: {
    slug, title, countryCode, city, skills, seniority: index === 4 ? 'Staff' : 'Senior',
    summary: `Join ${name}'s product team in ${city}. Own delivery, collaborate with engineers and shape the next stage of the platform.`,
    description: `LOCAL TEST VACANCY. This company and role are fictional. Applications remain in your local database.\n\nThe role\nJoin a cross-functional team building a collaboration platform used by distributed teams. You will own a product area from discovery through delivery, with time reserved for reliability and improving the developer experience.\n\nWhat you will do\n• Design and deliver features using ${skills.join(', ')}.\n• Work with product and design to turn user problems into small, testable releases.\n• Review changes, improve automated tests and monitor services after release.\n• Share decisions and mentor colleagues through pairing and code review.\n\nWhat you bring\nExperience shipping production software, clear written communication and a pragmatic approach to trade-offs. You can explain your decisions and ask for help when the requirements are unclear.\n\nLocation and support\n${index === 4 ? 'Remote within EMEA, with optional team meetups.' : `Hybrid in ${city}, with two office days per week. The fictional package includes visa assistance and an initial relocation allowance.`}\n\nInterview process\nIntroductory call, a technical conversation about previous work, and a team discussion. This is illustrative content for reviewing the product, not a real hiring process.`,
    employmentType: 'FULL_TIME', workplaceType: index === 4 ? 'REMOTE' : 'HYBRID',
    salary: { min, max, currency, period: 'YEAR' },
    relocationOffered: index !== 4, visaSponsorship: index !== 3 && index !== 4,
  },
}))

export function reviewCsv() {
  const columns = readFileSync(new URL('../../public/templates/vacancies.csv', import.meta.url), 'utf8').trim().split(',')
  const item = reviewVacancies[5]
  const row = {
    source_name: item.source.name, source_url: item.source.url, source_external_id: item.source.externalId,
    company_name: item.company.name, company_slug: item.company.slug, vacancy_slug: item.vacancy.slug,
    title: item.vacancy.title, summary: item.vacancy.summary, description: item.vacancy.description,
    employment_type: item.vacancy.employmentType, workplace_type: item.vacancy.workplaceType,
    seniority: item.vacancy.seniority, country_code: item.vacancy.countryCode, city: item.vacancy.city,
    salary_min: item.vacancy.salary.min, salary_max: item.vacancy.salary.max,
    salary_currency: item.vacancy.salary.currency, salary_period: 'YEAR', skills: item.vacancy.skills.join('|'),
    relocation_offered: true, visa_sponsorship: true,
  }
  return `${columns.join(',')}\n${columns.map(key => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(',')}\n`
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
