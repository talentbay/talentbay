import { randomUUID } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { leverSourceSchema } from '#server/services/sources/lever-contract'
import { normalizeLeverJobs } from '#server/services/sources/lever-normalize'
import { fetchLeverJobs } from '#server/services/sources/lever-fetch'
import { contactRule, contactSection, fixtureMailbox, relocationSection, worldwideSection } from './lever-contact.fixture'

const source = leverSourceSchema.parse({ site: 'fixture-company', region: 'GLOBAL', company: { name: 'Fictional Source Company', slug: 'fixture-source-company' }, locations: { Berlin: { city: 'Berlin', countryCode: 'DE' } }, contactRule })
function posting() {
  const id = randomUUID()
  return {
    id, text: 'Synthetic TypeScript Engineer', country: 'DE', workplaceType: 'hybrid',
    categories: { commitment: 'Full-time', location: 'Berlin' },
    descriptionPlain: 'A fictional engineering role used only for isolated source tests.',
    lists: [contactSection, relocationSection, { text: 'Requirements', content: '<ul><li>TypeScript &amp; PostgreSQL</li><li>Testing</li></ul><script>do not retain this script</script><img src="https://attacker.invalid/track">' }],
    hostedUrl: `https://jobs.lever.co/fixture-company/${id}`,
    salaryRange: { min: 70_000, max: 90_000, currency: 'EUR', interval: 'per-year' },
  }
}
const response = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })

describe('Lever source normalization', () => {
  it('keeps structured facts but never copies source prose, HTML, lists or salary commentary', () => {
    const raw = posting()
    Object.assign(raw, { additionalPlain: 'PRIVATE_ADDITIONAL_PROSE', salaryDescriptionPlain: 'PRIVATE_SALARY_COMMENTARY' })
    const result = normalizeLeverJobs(source, [raw])
    expect(result.issues).toEqual([])
    expect(result.items[0]).toMatchObject({ source: { externalId: raw.id, name: 'Lever:global:fixture-company' }, vacancy: { city: 'Berlin', countryCode: 'DE', workplaceType: 'HYBRID', employmentType: 'FULL_TIME', salary: { min: 70000, max: 90000, currency: 'EUR', period: 'YEAR' }, skills: [], relocationOffered: true, visaSponsorship: false } })
    expect(result.items[0]!.vacancy.description).toBe('The full job description is available on the original employer page.')
    expect(JSON.stringify(result.items)).not.toMatch(/fictional engineering role|TypeScript & PostgreSQL|<li>|<script>|do not retain|attacker.invalid|PRIVATE_/)
    expect(result.items[0]!.vacancy.sourcePublishedAt).toBeUndefined()
    expect(normalizeLeverJobs(source, [raw]).items[0]!.vacancy.slug).toBe(result.items[0]!.vacancy.slug)
    expect(normalizeLeverJobs(source, [{ ...raw, text: 'Updated title' }]).items[0]!.vacancy.slug).toBe(result.items[0]!.vacancy.slug)
  })
  it('reports unsupported/missing facts instead of assuming full-time, onsite or a currency conversion', () => {
    const raw = posting()
    const cases = [
      [{ ...raw, categories: { ...raw.categories, commitment: 'Volunteer' } }, 'UNSUPPORTED_EMPLOYMENT'],
      [{ ...raw, workplaceType: 'unspecified' }, 'UNSPECIFIED_WORKPLACE'],
      [{ ...raw, text: `Engineer: ${fixtureMailbox}` }, 'CHECK_TITLE'],
      [{ ...raw, country: null, categories: { ...raw.categories, location: 'Unknown' } }, 'UNRESOLVED_LOCATION'],
      [{ ...raw, salaryRange: { ...raw.salaryRange, interval: 'per-project' } }, 'UNSUPPORTED_SALARY_PERIOD'],
      [{ ...raw, salaryRange: { ...raw.salaryRange, min: 1.5 } }, 'INVALID_RECORD'],
      [{ ...raw, hostedUrl: 'https://attacker.invalid/job' }, 'INVALID_SOURCE_URL'],
      [{ ...raw, hostedUrl: `https://user:password@jobs.lever.co/fixture-company/${raw.id}` }, 'INVALID_SOURCE_URL'],
    ] as const
    for (const [record, code] of cases) {
      const result = normalizeLeverJobs(source, [record])
      expect(result.items).toHaveLength(0)
      expect(result.issues[0]!.code).toBe(code)
      expect(JSON.stringify(result.issues)).not.toContain('password')
    }
    expect(normalizeLeverJobs(source, [raw, raw]).issues[0]!.code).toBe('DUPLICATE_ID')
  })
  it('uses only explicit location mapping, and does not mislabel a region string as a city', () => {
    const raw = posting()
    expect(normalizeLeverJobs(source, [{ ...raw, country: null }]).items[0]!.vacancy.city).toBe('Berlin')
    const result = normalizeLeverJobs(source, [{ ...raw, categories: { ...raw.categories, location: 'Remote in Germany' } }])
    expect(result.items[0]!.vacancy.city).toBeUndefined()
    expect(JSON.stringify(result.items)).not.toContain('Remote in Germany')
  })
  it('does not require or parse descriptions, even malformed or excessive optional prose', () => {
    const raw = posting()
    const result = normalizeLeverJobs(source, [{ ...raw, descriptionPlain: undefined, description: '<div>'.repeat(200) + raw.descriptionPlain + '</div>'.repeat(200) }])
    expect(result.items).toHaveLength(1)
    expect(result.issues).toEqual([])
    const withoutProse = { ...raw, descriptionPlain: undefined, description: undefined, lists: [contactSection, relocationSection] }
    expect(normalizeLeverJobs(source, [withoutProse]).items[0]).toEqual(result.items[0])
    expect(normalizeLeverJobs(source, [{ ...withoutProse, description: 'x'.repeat(100_001) }]).items[0]).toEqual(result.items[0])
  })
  it('only accepts one approved role-specific mailbox and never persists it in normalized output', () => {
    const raw = posting()
    const skipped: unknown[] = [
      [], undefined, { untrusted: 'not a list' },
      [{ text: 'Privacy', content: contactSection.content }],
      [contactSection, { ...contactSection, text: contactSection.text.toUpperCase() }],
      ...['<li>other@example.invalid</li>', '<li>https://example.invalid/apply</li>',
        `<li><a href="mailto:${fixtureMailbox}">Apply</a></li>`, `${contactSection.content}<li>two</li>`,
        `<li>Do not send to ${fixtureMailbox}</li>`, '<li>RECRUITING@example.invalid</li>'].map(content => [{ ...contactSection, content }]),
    ]
    for (const lists of skipped) {
      const result = normalizeLeverJobs(source, [{ ...raw, lists, descriptionPlain: fixtureMailbox, applyUrl: raw.hostedUrl + '/apply' }])
      expect(result).toMatchObject({ items: [], contactSkippedIds: [raw.id], issues: [] })
    }
    const eligible = normalizeLeverJobs(source, [{ ...raw, lists: [relocationSection, { ...contactSection, content: '<li>recruiting@EXAMPLE.INVALID</li>' }] }])
    expect(eligible.items).toHaveLength(1)
    expect(eligible.contactSkippedIds).toEqual([])
    expect(JSON.stringify(eligible)).not.toContain(fixtureMailbox)
  })
  it('only admits explicit relocation or corroborated worldwide remote, without guessing visa support or a destination', () => {
    const raw = posting()
    const global = { ...raw, workplaceType: 'remote', categories: { ...raw.categories, location: 'Worldwide', allLocations: ['Worldwide'] }, lists: [contactSection, worldwideSection] }
    for (const override of [
      { lists: [contactSection] }, { lists: [contactSection, relocationSection, worldwideSection] },
      { lists: [contactSection, { ...relocationSection, content: '<li>No relocation offered</li>' }] },
      { lists: [contactSection, { ...relocationSection, content: '<li>Visa sponsorship</li>' }] },
      { workplaceType: 'hybrid' }, { categories: { ...global.categories, location: 'Remote in EU' } },
      { categories: { ...global.categories, allLocations: ['Worldwide', 'US only'] } },
    ]) {
      const result = normalizeLeverJobs(source, [{ ...global, ...override, descriptionPlain: 'Worldwide remote without country restrictions. Relocation offered.' }])
      expect(result).toMatchObject({ items: [], issues: [], contactSkippedIds: [], mobilitySkippedIds: [raw.id] })
    }
    const result = normalizeLeverJobs(source, [global])
    expect(result.items[0]?.vacancy).toMatchObject({ countryCode: 'DE', workplaceType: 'REMOTE', relocationOffered: false, visaSponsorship: false })
    expect(result.items[0]?.vacancy.city).toBeUndefined()
    expect(normalizeLeverJobs(source, [{ ...global, country: null }]).issues[0]?.code).toBe('UNRESOLVED_LOCATION')
  })
})

describe('bounded server-only Lever fetch', () => {
  it('fetches JSON pages from a fixed provider origin and completes before any importer is involved', async () => {
    const pages = [Array.from({ length: 50 }, posting), [posting()]]
    const transport = vi.fn<typeof fetch>().mockImplementation(async () => response(pages.shift()))
    const result = await fetchLeverJobs(source, transport)
    expect(result.items).toHaveLength(51)
    expect(result.pageCount).toBe(2)
    const [url, options] = transport.mock.calls[0]!
    expect(String(url)).toBe('https://api.lever.co/v0/postings/fixture-company?mode=json&skip=0&limit=50')
    expect(options).toMatchObject({ method: 'GET', redirect: 'error', credentials: 'omit', headers: { accept: 'application/json' } })
    expect(Object.keys(options!.headers!)).toEqual(['accept'])
    expect(options!.signal).toBeInstanceOf(AbortSignal)
    expect(String(transport.mock.calls[1]![0])).toContain('skip=50')
  })
  it('surfaces 429 retry guidance without retrying/sleeping or exposing a provider response body', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('not logged private body', { status: 429, headers: { 'retry-after': '60' } }))
    await expect(fetchLeverJobs(source, transport)).rejects.toMatchObject({ code: 'RATE_LIMIT', retryAfterSeconds: 60 })
    expect(transport).toHaveBeenCalledTimes(1)
  })
  it.each([
    [() => new Response('html', { headers: { 'content-type': 'text/html' } }), 'CONTENT_TYPE'],
    [() => new Response('{bad', { headers: { 'content-type': 'application/json' } }), 'INVALID_JSON'],
    [() => new Response('[]', { headers: { 'content-type': 'application/json', 'content-length': '2097153' } }), 'BODY_LIMIT'],
    [() => new Response(JSON.stringify(['x'.repeat(2 * 1024 * 1024)]), { headers: { 'content-type': 'application/json' } }), 'BODY_LIMIT'],
    [() => new Response('hidden body', { status: 503 }), 'HTTP'],
  ])('fails closed on malformed/bounded provider data', async (makeResponse, code) => {
    await expect(fetchLeverJobs(source, vi.fn<typeof fetch>().mockResolvedValue(makeResponse()))).rejects.toMatchObject({ code })
  })
  it('rejects overlapping provider pages and a non-terminating result set', async () => {
    const raw = posting()
    const duplicate = vi.fn<typeof fetch>().mockResolvedValue(response(Array.from({ length: 50 }, () => raw)))
    await expect(fetchLeverJobs(source, duplicate)).rejects.toMatchObject({ code: 'DUPLICATE_ID' })
    const endless = vi.fn<typeof fetch>().mockImplementation(async () => response(Array.from({ length: 50 }, posting)))
    await expect(fetchLeverJobs(source, endless)).rejects.toMatchObject({ code: 'PAGE_LIMIT' })
    expect(endless).toHaveBeenCalledTimes(5)
  })
  it('does not hide a repeated posting across pages just because it has no eligible contact', async () => {
    const excluded = { ...posting(), lists: [] }
    const pages = [[excluded, ...Array.from({ length: 49 }, posting)], [excluded]]
    const transport = vi.fn<typeof fetch>().mockImplementation(async () => response(pages.shift()))
    await expect(fetchLeverJobs(source, transport)).rejects.toMatchObject({ code: 'DUPLICATE_ID' })
    expect(transport).toHaveBeenCalledTimes(2)
  })
  it('redacts network errors and refuses a user-controlled fetch URL/site', async () => {
    const transport = vi.fn<typeof fetch>().mockRejectedValue(new Error('credential=do-not-log'))
    await expect(fetchLeverJobs(source, transport)).rejects.toMatchObject({ code: 'NETWORK', message: 'Source fetch failed: NETWORK' })
    await expect(fetchLeverJobs({ ...source, site: '../../metadata' }, transport)).rejects.toThrow()
    expect(transport).toHaveBeenCalledTimes(1)
  })
  it('uses the explicit EU provider and surfaces an aborted request without leaking its cause', async () => {
    const raw = posting()
    const eu = { ...source, region: 'EU' as const }
    const transport = vi.fn<typeof fetch>().mockResolvedValue(response([{ ...raw, hostedUrl: raw.hostedUrl.replace('jobs.lever.co', 'jobs.eu.lever.co') }]))
    expect((await fetchLeverJobs(eu, transport)).items).toHaveLength(1)
    expect(String(transport.mock.calls[0]![0])).toMatch(/^https:\/\/api\.eu\.lever\.co\//)
    await expect(fetchLeverJobs(source, vi.fn<typeof fetch>().mockRejectedValue(new DOMException('private request detail', 'AbortError')))).rejects.toMatchObject({ code: 'NETWORK', message: 'Source fetch failed: NETWORK' })
  })
})
