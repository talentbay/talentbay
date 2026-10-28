import { randomInt } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const subject = randomInt(1_000_000_000, 1_000_000_000_000)
const origin = 'http://127.0.0.1:3129'
test.afterAll(async () => {
  await sql`delete from users where id in (select user_id from oauth_accounts where provider='TELEGRAM' and provider_account_id in ${sql(Array.from({ length: 12 }, (_, index) => String(subject+index)))})`
  await sql.end()
})

test('an SDK-shaped object without signed launch data is still a guest browser', async ({ page }) => {
  let authRequests = 0
  page.on('request', request => { if (request.url().endsWith('/api/v1/auth/telegram')) authRequests++ })
  await page.addInitScript(() => {
    window.Telegram = { WebApp: { initData: '', ready: () => {} } }
    Object.assign(window.Telegram.WebApp!, { initDataUnsafe: { user: { id: 1, first_name: 'Untrusted Admin' } } })
  })
  await page.goto('/profile')
  await expect(page.getByText('Your TalentBay account', { exact: true })).toBeVisible()
  expect((await (await page.request.get('/api/_auth/session')).json()).user).toBeUndefined()
  expect(authRequests).toBe(0)
})

for (const failure of ['expired', 'tampered'] as const) {
  test(`a ${failure} signed-host launch rejects auth, strips launch metadata and keeps navigation usable`, async ({ page }) => {
    let initData = signedLaunch(subject, 'Invalid Host Fixture', undefined, failure === 'expired' ? Math.floor(Date.now()/1000)-600 : undefined)
    if (failure === 'tampered') initData = initData.replace('Invalid', 'Tampered')
    await page.addInitScript(({ initData }) => { window.Telegram = { WebApp: { initData, ready: () => {} } } }, { initData })
    const response = page.waitForResponse(response => response.url().endsWith('/api/v1/auth/telegram'))
    await page.goto('/jobs#' + new URLSearchParams({ tgWebAppData: initData }))
    const auth = await response
    expect(auth.status()).toBe(401)
    expect(auth.headers()['cache-control']).toContain('no-store')
    await expect(page.getByText('Telegram sign-in is unavailable. You can still browse jobs or use another sign-in method.')).toBeVisible()
    await expect(page).toHaveURL(/\/jobs$/)
    await page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true }).getByRole('link', { name: 'Saved', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Saved jobs', exact: true })).toBeVisible()
    expect((await (await page.request.get('/api/_auth/session')).json()).user).toBeUndefined()
    expect(await sql`select id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject)}`).toHaveLength(0)
  })
}

test('failed SDK loading leaves a usable browser fallback and no launch fragment', async ({ page }) => {
  await page.route('https://telegram.org/js/telegram-web-app.js', route => route.abort())
  await page.goto('/jobs#tgWebAppData=synthetic-unavailable-host')
  await expect(page.getByText('Telegram sign-in is unavailable. You can still browse jobs or use another sign-in method.')).toBeVisible()
  await expect(page).toHaveURL(/\/jobs$/)
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
})

test('hashless reload restores the SDK from its cached launch hint and validates the identity again', async ({ page }) => {
  const initData = signedLaunch(subject+5, 'Cached SDK Candidate')
  await page.addInitScript(({ initData }) => {
    sessionStorage.setItem('__telegram__initParams', JSON.stringify({ tgWebAppData: initData }))
  }, { initData })
  await page.route('https://telegram.org/js/telegram-web-app.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.Telegram={WebApp:{initData:JSON.parse(sessionStorage.getItem('__telegram__initParams')).tgWebAppData,ready:function(){}}}`,
  }))
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Cached SDK Candidate', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cached SDK Candidate', exact: true })).toBeVisible()
  await page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true }).getByRole('link', { name: 'Applications', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your applications', exact: true })).toBeVisible()
  await expect(page.getByText('Keep your applications together')).toHaveCount(0)
  expect(await sql`select id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject+5)}`).toHaveLength(1)
})

test('a cached forged launch is only a loading hint, never a signed identity', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('__telegram__initParams', JSON.stringify({ tgWebAppData: 'forged-cache-value' })))
  await page.route('https://telegram.org/js/telegram-web-app.js', route => route.fulfill({
    contentType: 'application/javascript', body: `window.Telegram={WebApp:{initData:'forged-cache-value',ready:function(){}}}`,
  }))
  const response = page.waitForResponse(response => response.url().endsWith('/api/v1/auth/telegram'))
  await page.goto('/profile')
  expect((await response).status()).toBe(401)
  await expect(page.getByText('Your TalentBay account', { exact: true })).toBeVisible()
  expect((await (await page.request.get('/api/_auth/session')).json()).user).toBeUndefined()
})

test('an encoded launch authenticates before router normalization and clears its unchanged carrier', async ({ page }) => {
  const initData = signedLaunch(subject+6, 'Encoded Launch Candidate')
  await page.addInitScript(({ initData }) => { window.Telegram = { WebApp: { initData, ready: () => {} } } }, { initData })
  const response = page.waitForResponse(response => response.url().endsWith('/api/v1/auth/telegram'))
  await page.goto('/profile#' + new URLSearchParams({ tgWebAppData: initData, tgWebAppVersion: '9.2' }))
  const auth = await response
  expect(auth.request().postDataJSON().initData).toBe(initData)
  expect(auth.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Encoded Launch Candidate', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/profile$/)
})

test('explicit Telegram linking uses the launch identity, never a different valid SDK cache identity', async ({ page, context }) => {
  const login = await context.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(subject+9, 'Link Owner Fixture') } })
  expect(login.status()).toBe(200)
  const { user } = await login.json()
  try {
    // A disposable Google-only account fixture; this does not exercise real Google OAuth.
    const googleID = `google-only-fixture-${subject}`
    await sql`update oauth_accounts set provider='GOOGLE', provider_account_id=${googleID} where user_id=${user.id}`
    const fresh = signedLaunch(subject+10, 'Intended Link Candidate')
    const stale = signedLaunch(subject+11, 'Different SDK Cache')
    await page.addInitScript(({ stale }) => { window.Telegram = { WebApp: { initData: stale, ready: () => {} } } }, { stale })
    const initial = page.waitForResponse(response => response.url().endsWith('/api/v1/auth/telegram'))
    await page.goto('/settings#' + new URLSearchParams({ tgWebAppData: fresh }))
    expect((await initial).status()).toBe(409)
    const response = page.waitForResponse(response => response.url().endsWith('/api/v1/auth/telegram'))
    await page.getByRole('listitem').filter({ has: page.getByText('Telegram', { exact: true }) }).getByRole('button', { name: 'Connect', exact: true }).click()
    const linked = await response
    expect(linked.request().postDataJSON()).toEqual({ initData: fresh, mode: 'link' })
    expect(linked.status()).toBe(200)
    expect(await sql`select user_id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject+10)}`).toEqual([{ user_id: user.id }])
    expect(await sql`select id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject+11)}`).toHaveLength(0)
    expect((await (await context.request.get('/api/_auth/session')).json()).user.id).toBe(user.id)
  } finally { await sql`delete from users where id=${user.id}` }
})

test('navigation during SDK loading authenticates the fresh launch, not an expired cached launch', async ({ page }) => {
  const fresh = signedLaunch(subject+7, 'Fresh SDK Candidate')
  const stale = signedLaunch(subject+8, 'Expired SDK Cache', undefined, Math.floor(Date.now()/1000)-600)
  await page.addInitScript(({ stale }) => sessionStorage.setItem('__telegram__initParams', JSON.stringify({ tgWebAppData: stale })), { stale })
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('https://telegram.org/js/telegram-web-app.js', async (route) => {
    await held
    await route.fulfill({
      contentType: 'application/javascript',
      body: `window.Telegram={WebApp:{initData:new URLSearchParams(location.hash.slice(1)).get('tgWebAppData')||JSON.parse(sessionStorage.getItem('__telegram__initParams')).tgWebAppData,ready:function(){}}}`,
    })
  })
  try {
    await page.goto('/jobs#' + new URLSearchParams({ tgWebAppData: fresh }))
    await expect(page.getByRole('status').filter({ hasText: 'Signing you in to Telegram' })).toBeVisible()
    await page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true }).getByRole('link', { name: 'Applications', exact: true }).click()
    await expect(page).toHaveURL(/\/applications$/)
    const response = page.waitForResponse(response => response.url().endsWith('/api/v1/auth/telegram'))
    release()
    const auth = await response
    expect(auth.request().postDataJSON().initData).toBe(fresh)
    expect(auth.status()).toBe(200)
    await expect(page.getByText('Keep your applications together')).toHaveCount(0)
    await page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true }).getByRole('link', { name: 'Profile', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Fresh SDK Candidate', exact: true })).toBeVisible()
    expect(await sql`select id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject+8)}`).toHaveLength(0)
  } finally { release() }
})

test('optional host methods throwing do not block real auth or repeat identity creation on reload', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(({ initData }) => {
    const unavailable = () => { throw new Error('Optional synthetic host capability unavailable') }
    window.Telegram = { WebApp: {
      initData, ready: unavailable, expand: unavailable, onEvent: unavailable, offEvent: unavailable,
      BackButton: { show: unavailable, hide: unavailable, onClick: unavailable, offClick: unavailable },
      SettingsButton: { show: unavailable, onClick: unavailable, offClick: unavailable },
      HapticFeedback: { selectionChanged: unavailable, notificationOccurred: unavailable },
      safeAreaInset: { top: 999, bottom: -10, left: 0, right: 0 },
    } }
  }, { initData: signedLaunch(subject+1, 'Optional Host Candidate') })
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Optional Host Candidate', exact: true })).toBeVisible()
  const first = (await (await page.request.get('/api/_auth/session')).json()).user.id
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--host-safe-top'))).toBe('200px')
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--host-safe-bottom'))).toBe('0px')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Optional Host Candidate', exact: true })).toBeVisible()
  expect((await (await page.request.get('/api/_auth/session')).json()).user.id).toBe(first)
  expect(await sql`select id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject+1)}`).toHaveLength(1)
  expect(errors).toEqual([])
})

test('slow launch auth does not block public navigation or overwrite a non-launch destination', async ({ page }) => {
  let release!: () => void
  let releaseProfile!: () => void
  const hold = new Promise<void>(resolve => { release = resolve })
  const profileHold = new Promise<void>(resolve => { releaseProfile = resolve })
  // Hold the actual profile chunk: its navigation must be protected before route commit.
  const generated = await import(new URL('../../.output/server/chunks/virtual/precomputed.mjs', import.meta.url).href)
  const profileFile = generated.default.modules['pages/profile.vue'].file
  expect(typeof profileFile).toBe('string')
  await page.route(`**/_nuxt/${profileFile}`, async route => { await profileHold; await route.continue() })
  await page.route('**/api/v1/auth/telegram', async route => { await hold; await route.continue() })
  await page.addInitScript(({ initData }) => { window.Telegram = { WebApp: { initData, ready: () => {} } } }, { initData: signedLaunch(subject+2, 'Slow Host Candidate', 'job_nonexistent-fixture') })
  try {
    await page.goto('/jobs')
    const connecting = page.getByRole('status').filter({ hasText: 'Signing you in to Telegram' })
    await expect(connecting).toBeVisible()
    await page.getByRole('navigation', { name: 'Candidate navigation' }).filter({ visible: true }).getByRole('link', { name: 'Profile', exact: true }).click()
    release()
    await expect(connecting).toHaveCount(0)
    releaseProfile()
    await expect(page.getByRole('heading', { name: 'Slow Host Candidate', exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/profile$/)
  } finally { release(); releaseProfile() }
})

test('separate browser stores do not share sessions and a conflicting host cannot replace the current account', async ({ browser, page, context }) => {
  const first = await context.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(subject+3, 'Existing Browser Candidate') } })
  expect(first.status()).toBe(200)
  const owner = (await first.json()).user.id
  const independent = await browser.newContext({ baseURL: origin })
  try {
    expect((await (await independent.request.get('/api/_auth/session')).json()).user).toBeUndefined()
    await page.addInitScript(({ initData }) => { window.Telegram = { WebApp: { initData, ready: () => {} } } }, { initData: signedLaunch(subject+4, 'Different Host Candidate') })
    await page.goto('/profile')
    await expect(page.getByText('This browser is signed in to another account. Manage your sign-in methods in Settings.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Existing Browser Candidate', exact: true })).toBeVisible()
    expect((await (await context.request.get('/api/_auth/session')).json()).user.id).toBe(owner)
    expect(await sql`select id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject+4)}`).toHaveLength(0)
    const second = await independent.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(subject+3, 'Existing Browser Candidate') } })
    expect((await second.json()).user.id).toBe(owner)
  } finally { await independent.close() }
})
