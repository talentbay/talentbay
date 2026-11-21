import { expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

export async function setFixtureProfile(request: APIRequestContext, ownerID: number, data: Record<string, string>) {
  const res = await request.put('/api/v1/profile', {
    headers: { origin: 'http://127.0.0.1:3129', 'X-TalentBay-Profile-Owner': String(ownerID) },
    data,
  })
  expect(res.status()).toBe(200)
}

export async function getApplicationContext(request: APIRequestContext, slug: string): Promise<string> {
  const response = await request.get(`/api/v1/vacancies/${encodeURIComponent(slug)}`)
  expect(response.status()).toBe(200)
  const { applicationContext } = await response.json()
  expect(applicationContext).toMatch(/^v1:[a-f0-9]{64}$/)
  return applicationContext as string
}

export async function getCandidateContext(request: APIRequestContext): Promise<string> {
  const response = await request.get('/api/v1/profile')
  expect(response.status()).toBe(200)
  const { candidateContext } = await response.json()
  expect(candidateContext).toMatch(/^v1:[a-f0-9]{64}$/)
  return candidateContext as string
}

export async function getApplicationPreconditions(request: APIRequestContext, slug: string) {
  const expectedContext = await getApplicationContext(request, slug)
  const expectedCandidateContext = await getCandidateContext(request)
  return { expectedContext, expectedCandidateContext }
}
