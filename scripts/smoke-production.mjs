import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import postgres from 'postgres'

const port = process.env.SMOKE_PORT || '3101'
const baseUrl = `http://127.0.0.1:${port}`
const sessionPassword = process.env.NUXT_SESSION_PASSWORD
  || 'talentbay-local-smoke-password-32chars'

let serverOutput = ''
const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: port,
    NUXT_SESSION_PASSWORD: sessionPassword,
    NUXT_PUBLIC_LOCAL_REVIEW_PORTAL: 'http://127.0.0.1:3131',
    NUXT_TELEGRAM_BOT_ID: '', NUXT_TELEGRAM_BOT_USERNAME: '', NUXT_TELEGRAM_WEBHOOK_SECRET: '', NUXT_TELEGRAM_APP_ORIGIN: '',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString()
})
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString()
})

async function waitUntilReady() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited before becoming ready.\n${serverOutput}`)
    }

    try {
      const response = await fetch(`${baseUrl}/jobs`, {
        signal: AbortSignal.timeout(5_000),
      })
      if (response.ok) {
        return
      }
    }
    catch {
      // The server may still be binding the port.
    }

    await delay(100)
  }

  throw new Error(`Production server did not become ready.\n${serverOutput}`)
}

async function assertResponse(path, expectedStatus, assertion) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  })

  const allowedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]
  if (!allowedStatuses.includes(response.status)) {
    throw new Error(`${path} returned ${response.status}; expected ${allowedStatuses.join(' or ')}`)
  }

  await assertion?.(response)
}

async function assertDatabaseCatalog(body) {
  if (!process.env.DATABASE_URL) {
    return
  }

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
  })

  try {
    const [row] = await sql`
      select count(*)::int as total
      from vacancies
      inner join organisations
        on vacancies.organisation_id = organisations.id
      where vacancies.status = 'PUBLISHED'
        and vacancies.review_status = 'VERIFIED'
        and organisations.status = 'ACTIVE'
    `

    if (!row || body.total !== row.total) {
      throw new Error(
        `/api/v1/vacancies total ${body.total} does not match PostgreSQL total ${row?.total}`,
      )
    }
  }
  finally {
    await sql.end({ timeout: 5 })
  }
}

try {
  await waitUntilReady()

  await assertResponse('/api/unknown/private%40example.invalid', 404, async (response) => {
    if (response.headers.get('cache-control') !== 'no-store') throw new Error('Unknown API response must not be cached')
    const result = await response.json()
    if (result.statusMessage !== 'API endpoint not found' || 'url' in result) throw new Error('Unknown API response must not echo the URL or render a page')
  })
  await assertResponse('/api/health', 200, async (response) => {
    const body = await response.json()
    if (body.status !== 'ok' || body.service !== 'talentbay') {
      throw new Error('/api/health did not return the liveness contract')
    }
    if (response.headers.get('cache-control') !== 'no-store') {
      throw new Error('/api/health must not be cached')
    }
  })

  await assertResponse('/', 302, (response) => {
    if (response.headers.get('location') !== '/jobs') {
      throw new Error('/ did not redirect to /jobs')
    }
  })

  await assertResponse('/jobs', 200, async (response) => {
    const html = await response.text()
    if (!html.includes('TalentBay') || !html.includes('Demo data')) {
      throw new Error('/jobs did not render the expected SSR preview')
    }
    if (html.includes('Switch test account')) {
      throw new Error('Local review controls must not render in production')
    }
  })

  // The persona chooser belongs to a separate local process, never the app server.
  await assertResponse('/session/candidate', 404)
  await assertResponse('/bot', 404)
  await assertResponse('/sample.csv', 404)
  const localSession = await fetch(`${baseUrl}/session/admin`, { method: 'POST', signal: AbortSignal.timeout(5000) })
  if (localSession.status !== 404 || localSession.headers.getSetCookie().some(cookie => cookie.startsWith('nuxt-session='))) {
    throw new Error('Production must not expose the local review session helper')
  }

  await assertResponse('/api/v1/vacancies', 200, async (response) => {
    const body = await response.json()
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new Error('/api/v1/vacancies did not return preview vacancies')
    }

    await assertDatabaseCatalog(body)
  })

  await assertResponse('/terms', 200)
  await assertResponse('/api/_auth/session', 200)

  const disabledBot = await fetch(`${baseUrl}/api/v1/bot/telegram`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(5000),
  })
  if (disabledBot.status !== 503 || disabledBot.headers.getSetCookie().length || disabledBot.headers.get('cache-control') !== 'no-store') {
    throw new Error('Unconfigured bot webhook must remain disabled without creating a session')
  }

  // Exercise the real compiled HTTP guards, not mocked session functions.
  await assertResponse('/api/v1/profile', 401)
  await assertResponse('/api/v1/applications', 401)
  await assertResponse('/api/v1/auth/identities', 401)
  await assertResponse('/api/v1/auth/capabilities', 200, async (response) => {
    const capabilities = await response.json()
    if (!['google', 'github', 'telegram'].every(provider => typeof capabilities[provider] === 'boolean')) {
      throw new Error('Authentication capabilities did not return boolean availability flags')
    }
  })
  await assertResponse('/api/v1/admin/dashboard', 403)
  for (const path of ['/API/v1/admin/dashboard', '/api/v1/ADMIN/dashboard', '/api/v1/admin/USERS', '/api/v1/admin/VACANCIES']) {
    await assertResponse(path, [403, 404])
  }

  for (const path of ['/api/v1/auth/telegram', '/api/v1/auth/link']) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://attacker.invalid' },
      body: '{}', signal: AbortSignal.timeout(5_000),
    })
    if (response.status !== 403 || response.headers.getSetCookie().some(cookie => cookie.startsWith('nuxt-session='))) {
      throw new Error('Cross-origin authentication mutation was not rejected before session writing')
    }
  }

  for (const provider of ['google', 'github']) {
    for (const query of ['?code=smoke-code', '?code=smoke-code&state=unbound-state']) {
      await assertResponse(`/api/v1/auth/${provider}${query}`, 400, (response) => {
        if (response.headers.getSetCookie().some(cookie => cookie.startsWith('nuxt-session='))) {
          throw new Error('Rejected OAuth callback must not issue a session')
        }
      })
    }
  }

  console.log('Production smoke test passed (liveness, public routes, anonymous guards and unbound OAuth callbacks).')
}
finally {
  server.kill('SIGTERM')
  await Promise.race([
    new Promise(resolve => server.once('exit', resolve)),
    delay(2_000),
  ])
}
