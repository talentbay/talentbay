import { describe, expect, it } from 'vitest'
import { vacancyImportRequestSchema } from '#server/services/vacancies/import-vacancies'

const validItem = {
  source: {
    name: 'Example ATS',
    url: 'https://jobs.example.com/roles/123',
    externalId: '123',
  },
  company: {
    name: 'Example Company',
    slug: 'example-company',
    websiteUrl: 'https://example.com',
  },
  vacancy: {
    slug: 'senior-typescript-engineer-example',
    title: 'Senior TypeScript Engineer',
    description: 'Build and maintain typed product services for an international team.',
    employmentType: 'FULL_TIME',
    workplaceType: 'HYBRID',
    countryCode: 'gb',
    city: 'London',
    salary: {
      min: 90_000,
      max: 120_000,
      currency: 'gbp',
      period: 'YEAR',
    },
    skills: ['TypeScript', 'PostgreSQL', 'TypeScript'],
  },
}

describe('vacancyImportRequestSchema', () => {
  it('normalizes country and currency codes and applies boolean defaults', () => {
    const result = vacancyImportRequestSchema.parse({ items: [validItem] })
    const vacancy = result.items[0]?.vacancy

    expect(vacancy?.countryCode).toBe('GB')
    expect(vacancy?.salary?.currency).toBe('GBP')
    expect(vacancy?.relocationOffered).toBe(false)
    expect(vacancy?.visaSponsorship).toBe(false)
  })

  it('rejects an inverted salary range', () => {
    const result = vacancyImportRequestSchema.safeParse({
      items: [{
        ...validItem,
        vacancy: {
          ...validItem.vacancy,
          salary: {
            ...validItem.vacancy.salary,
            min: 130_000,
            max: 120_000,
          },
        },
      }],
    })

    expect(result.success).toBe(false)
  })

  it('requires stable source identity for idempotent imports', () => {
    const result = vacancyImportRequestSchema.safeParse({
      items: [{
        ...validItem,
        source: {
          ...validItem.source,
          externalId: '',
        },
      }],
    })

    expect(result.success).toBe(false)
  })
})
