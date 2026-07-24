import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

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
      const response = await fetch(`${baseUrl}/jobs`)
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
  })

  if (response.status !== expectedStatus) {
    throw new Error(`${path} returned ${response.status}; expected ${expectedStatus}`)
  }

  await assertion?.(response)
}

try {
  await waitUntilReady()

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
  })

  await assertResponse('/api/v1/vacancies', 200, async (response) => {
    const body = await response.json()
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new Error('/api/v1/vacancies did not return preview vacancies')
    }
  })

  await assertResponse('/terms', 200)
  await assertResponse('/api/_auth/session', 200)

  console.log('Production smoke test passed.')
}
finally {
  server.kill('SIGTERM')
  await Promise.race([
    new Promise(resolve => server.once('exit', resolve)),
    delay(2_000),
  ])
}
