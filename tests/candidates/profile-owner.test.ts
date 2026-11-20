import { createApp, createError, toWebHandler } from 'h3'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import putProfile from '#server/api/v1/profile/index.put'

const { save, session } = vi.hoisted(() => ({ save: vi.fn(), session: vi.fn() }))
vi.mock('#server/services/candidates/profile', async (original) => ({
  ...await original<typeof import('#server/services/candidates/profile')>(), saveCandidateProfile: save,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('requireUserSession', session)
  session.mockResolvedValue({ user: { id: 17 } })
  save.mockResolvedValue({ saved: true })
})
afterEach(() => vi.unstubAllGlobals())

function put(owner?: string, origin = 'https://fixture.example') {
  const app = createApp()
  app.use('/api/v1/profile', putProfile)
  const headers = new Headers({ origin, host: 'fixture.example', 'x-forwarded-proto': 'https', 'content-type': 'application/json' })
  if (owner !== undefined) headers.set('X-TalentBay-Profile-Owner', owner)
  return toWebHandler(app)(new Request('https://fixture.example/api/v1/profile', {
    method: 'PUT', headers, body: JSON.stringify({ headline: 'Synthetic edit' }),
  }))
}

it('saves when the header matches the authenticated owner', async () => {
  expect((await put('17')).status).toBe(200)
  expect(save).toHaveBeenCalledExactlyOnceWith(17, { headline: 'Synthetic edit' })
})

it.each([undefined, '16', '', '017', '17.0', '17, 16'])('rejects a missing, stale, or malformed owner header (%s) before saving', async (owner) => {
  expect((await put(owner)).status).toBe(412)
  expect(save).not.toHaveBeenCalled()
})

it('does not let the header replace authentication or same-origin validation', async () => {
  session.mockRejectedValueOnce(createError({ statusCode: 401 }))
  expect((await put('17')).status).toBe(401)
  expect((await put('17', 'https://other.example')).status).toBe(403)
  expect(save).not.toHaveBeenCalled()
})
