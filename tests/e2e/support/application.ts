import { expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

export async function getApplicationContext(request: APIRequestContext, slug: string): Promise<string> {
  const response = await request.get(`/api/v1/vacancies/${encodeURIComponent(slug)}`)
  expect(response.status()).toBe(200)
  const { applicationContext } = await response.json()
  expect(applicationContext).toMatch(/^v1:[a-f0-9]{64}$/)
  return applicationContext as string
}
