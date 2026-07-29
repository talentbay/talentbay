import postgres from 'postgres'

const previewSourceName = 'TalentBay preview dataset'

const previewVacancies = [
  {
    externalId: 'preview-1',
    slug: 'senior-backend-engineer-london',
    title: 'Senior Backend Engineer',
    summary: 'Build high-scale TypeScript services for AI-enabled product workflows.',
    description: 'Own backend services, data contracts and reliability work for a distributed product engineering team.',
    company: { name: 'Atlas Video', slug: 'atlas-video' },
    countryCode: 'GB',
    city: 'London',
    workplaceType: 'HYBRID',
    employmentType: 'FULL_TIME',
    seniority: 'Senior',
    salary: { min: 95_000, max: 125_000, currency: 'GBP', period: 'YEAR' },
    skills: ['TypeScript', 'PostgreSQL', 'Node.js'],
    relocationOffered: true,
    visaSponsorship: true,
    publishedAt: new Date('2026-07-21T09:00:00.000Z'),
  },
  {
    externalId: 'preview-2',
    slug: 'senior-frontend-engineer-amsterdam',
    title: 'Senior Frontend Engineer',
    summary: 'Shape collaborative product experiences with Vue and TypeScript.',
    description: 'Lead frontend architecture, accessibility and performance for a real-time collaboration product.',
    company: { name: 'Northstar Canvas', slug: 'northstar-canvas' },
    countryCode: 'NL',
    city: 'Amsterdam',
    workplaceType: 'HYBRID',
    employmentType: 'FULL_TIME',
    seniority: 'Senior',
    salary: { min: 90_000, max: 120_000, currency: 'EUR', period: 'YEAR' },
    skills: ['Vue', 'TypeScript', 'Accessibility'],
    relocationOffered: true,
    visaSponsorship: true,
    publishedAt: new Date('2026-07-19T12:00:00.000Z'),
  },
  {
    externalId: 'preview-3',
    slug: 'staff-fullstack-engineer-remote-emea',
    title: 'Staff Fullstack Engineer',
    summary: 'Own end-to-end platform capabilities for distributed engineering teams.',
    description: 'Design shared platform capabilities across frontend, backend and developer infrastructure.',
    company: { name: 'Common Thread', slug: 'common-thread' },
    countryCode: 'EU',
    city: null,
    workplaceType: 'REMOTE',
    employmentType: 'FULL_TIME',
    seniority: 'Staff',
    salary: { min: 105_000, max: 140_000, currency: 'EUR', period: 'YEAR' },
    skills: ['TypeScript', 'Vue', 'Node.js'],
    relocationOffered: false,
    visaSponsorship: false,
    publishedAt: new Date('2026-07-17T08:30:00.000Z'),
  },
  {
    externalId: 'preview-4',
    slug: 'platform-engineer-berlin',
    title: 'Platform Engineer',
    summary: 'Improve deployment safety, observability and developer experience.',
    description: 'Build the platform used by product teams to ship services safely across multiple regions.',
    company: { name: 'Relay Systems', slug: 'relay-systems' },
    countryCode: 'DE',
    city: 'Berlin',
    workplaceType: 'HYBRID',
    employmentType: 'FULL_TIME',
    seniority: 'Middle',
    salary: { min: 78_000, max: 102_000, currency: 'EUR', period: 'YEAR' },
    skills: ['Kubernetes', 'Go', 'Observability'],
    relocationOffered: true,
    visaSponsorship: true,
    publishedAt: new Date('2026-07-15T11:00:00.000Z'),
  },
  {
    externalId: 'preview-5',
    slug: 'product-engineer-lisbon',
    title: 'Product Engineer',
    summary: 'Ship customer-facing workflows across a modern TypeScript stack.',
    description: 'Work in a small product squad from discovery through delivery and production support.',
    company: { name: 'Harbor Finance', slug: 'harbor-finance' },
    countryCode: 'PT',
    city: 'Lisbon',
    workplaceType: 'ONSITE',
    employmentType: 'FULL_TIME',
    seniority: 'Middle',
    salary: { min: 55_000, max: 72_000, currency: 'EUR', period: 'YEAR' },
    skills: ['TypeScript', 'Vue', 'PostgreSQL'],
    relocationOffered: true,
    visaSponsorship: false,
    publishedAt: new Date('2026-07-12T10:00:00.000Z'),
  },
]

const connectionString = process.env.DATABASE_MIGRATION_URL
  || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_MIGRATION_URL or DATABASE_URL is required')
}

const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
})

try {
  await sql.begin(async (transaction) => {
    for (const item of previewVacancies) {
      const [organisation] = await transaction`
        insert into organisations (
          name,
          slug,
          status
        )
        values (
          ${item.company.name},
          ${item.company.slug},
          'ACTIVE'
        )
        on conflict (slug) do update set
          name = excluded.name,
          status = excluded.status,
          updated_at = now()
        returning id
      `

      await transaction`
        insert into vacancies (
          organisation_id,
          slug,
          title,
          summary,
          description,
          status,
          review_status,
          employment_type,
          workplace_type,
          seniority,
          country_code,
          city,
          salary_min,
          salary_max,
          salary_currency,
          salary_period,
          skills,
          relocation_offered,
          visa_sponsorship,
          source_name,
          source_external_id,
          published_at
        )
        values (
          ${organisation.id},
          ${item.slug},
          ${item.title},
          ${item.summary},
          ${item.description},
          'PUBLISHED',
          'VERIFIED',
          ${item.employmentType},
          ${item.workplaceType},
          ${item.seniority},
          ${item.countryCode},
          ${item.city},
          ${item.salary.min},
          ${item.salary.max},
          ${item.salary.currency},
          ${item.salary.period},
          ${sql.array(item.skills)},
          ${item.relocationOffered},
          ${item.visaSponsorship},
          ${previewSourceName},
          ${item.externalId},
          ${item.publishedAt}
        )
        on conflict (source_name, source_external_id) do update set
          organisation_id = excluded.organisation_id,
          slug = excluded.slug,
          title = excluded.title,
          summary = excluded.summary,
          description = excluded.description,
          status = excluded.status,
          review_status = excluded.review_status,
          employment_type = excluded.employment_type,
          workplace_type = excluded.workplace_type,
          seniority = excluded.seniority,
          country_code = excluded.country_code,
          city = excluded.city,
          salary_min = excluded.salary_min,
          salary_max = excluded.salary_max,
          salary_currency = excluded.salary_currency,
          salary_period = excluded.salary_period,
          skills = excluded.skills,
          relocation_offered = excluded.relocation_offered,
          visa_sponsorship = excluded.visa_sponsorship,
          published_at = excluded.published_at,
          updated_at = now()
      `
    }
  })

  console.log(`Seeded ${previewVacancies.length} preview vacancies.`)
}
finally {
  await sql.end()
}
