import { createHmac, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'

export const personas = {
  candidate: { id: 700000001, name: 'Sam Taylor', path: '/jobs', label: 'Candidate', description: 'Complete profile; received, in-progress, handoff, closed and legacy applications. London remains available for a new application.' },
  newcomer: { id: 700000002, name: 'New Candidate', path: '/profile', label: 'New candidate', description: 'Empty profile and no applications. Try the first-time experience.' },
  admin: { id: 700000003, name: 'Demo Operator', path: '/ktulhu/v1', label: 'Content operator', description: 'Real database counters, application review, vacancy review and CSV import. All records are fictional.' },
}

export function signedReviewLaunch(persona, token) {
  const values = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify({ id: persona.id, first_name: persona.name }),
  })
  values.sort()
  const key = createHmac('sha256', 'WebAppData').update(token).digest()
  const message = [...values].map(([name, value]) => `${name}=${value}`).join('\n')
  values.set('hash', createHmac('sha256', key).update(message).digest('hex'))
  return values.toString()
}

export function assertReviewOrigin(value) {
  const url = new URL(value)
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port
    || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Local review must use a plain 127.0.0.1 HTTP origin with an explicit port')
  }
  return url.origin
}

// This separate loopback-only process is never registered as a Nuxt route.
export function createReviewPortal({ origin, appOrigin, signIn, csv }) {
  origin = assertReviewOrigin(origin)
  appOrigin = assertReviewOrigin(appOrigin)
  const nonce = randomBytes(24).toString('hex')
  const form = (key, title, description) => `<form method="post" action="/session/${key}"><input type="hidden" name="nonce" value="${nonce}"><h2>${title}</h2><p>${description}</p><button>Open ${title.toLowerCase()}</button></form>`
  return createServer(async (req, res) => {
    res.setHeader('cache-control', 'no-store')
    res.setHeader('x-content-type-options', 'nosniff')
    // Same-origin forms need a non-opaque Origin for the CSRF check below.
    res.setHeader('referrer-policy', 'same-origin')
    res.setHeader('content-security-policy', `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${appOrigin}; frame-ancestors 'none'; base-uri 'none'`)
    if (req.headers.host !== new URL(origin).host) { res.writeHead(403).end(); return }
    if (req.method === 'GET' && req.url === '/') {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TalentBay local review</title><style>body{font:16px/1.6 system-ui;margin:0;color:#101828;background:#f2f4f7}main{max-width:720px;margin:auto;padding:32px 20px}h1{font-size:30px;margin:0}h2{font-size:20px}p{color:#475467}form{padding:20px 0;border-top:1px solid #d0d5dd}button{font:inherit;background:#174bcb;color:white;border:0;border-radius:6px;min-height:44px;padding:8px 16px;cursor:pointer}a{color:#174bcb}:focus-visible{outline:3px solid #174bcb;outline-offset:4px}</style><main><h1>TalentBay local review</h1><p>Choose a test account. This is the real application with a separate local PostgreSQL database. All people, companies and jobs are fictional. Nothing is sent to employers. External Google/GitHub/Telegram sign-in is not being tested here.</p>${Object.entries(personas).map(([key, item]) => form(key, item.label, item.description)).join('')}${form('guest', 'Guest', 'Browse without an account. This also signs out the current test account.')}<p><a href="/sample.csv" download>Download sample vacancy CSV</a></p><p>Candidate journey: Jobs → vacancy → relocation estimate → save → profile → apply → Applications.<br>Operator journey: CSV → validate → import → review → publish → Jobs; Applications → assign → contact → prepare package → record manual handoff → candidate progress/withdrawal.</p><p>Current limit: all outreach/handoff events are fictional local examples. No sender, confirmed employer delivery, live providers or real support service is connected. Relocation amounts are illustrative.</p></main></html>`)
      return
    }
    if (req.method === 'GET' && req.url === '/sample.csv') {
      res.setHeader('content-type', 'text/csv; charset=utf-8')
      res.setHeader('content-disposition', 'attachment; filename="talentbay-local-review.csv"')
      res.end(csv)
      return
    }
    if (req.method !== 'POST' || req.headers.origin !== origin
      || req.headers['content-type']?.split(';')[0] !== 'application/x-www-form-urlencoded') {
      console.warn('Local review request rejected:', req.method, req.headers.origin || 'no origin', req.headers['content-type'] || 'no content type')
      res.writeHead(403, { 'content-type': 'text/plain' }).end('Open the local review page and use its account buttons.'); return
    }
    const key = req.url?.match(/^\/session\/(candidate|newcomer|admin|guest)$/)?.[1]
    if (!key) { res.writeHead(404).end(); return }
    try {
      let body = ''
      for await (const chunk of req) {
        body += chunk.toString()
        if (Buffer.byteLength(body) > 512) { res.writeHead(413).end(); return }
      }
      if (new URLSearchParams(body).get('nonce') !== nonce) { res.writeHead(403).end(); return }
      const cookies = key === 'guest'
        ? ['nuxt-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0']
        : (await signIn(personas[key])).cookies
      res.setHeader('set-cookie', cookies)
      res.writeHead(303, { location: `${appOrigin}${personas[key]?.path || '/jobs'}` }).end()
    }
    catch {
      res.writeHead(503, { 'content-type': 'text/plain' }).end('Test account is unavailable. Check the local review terminal and retry.')
    }
  })
}
