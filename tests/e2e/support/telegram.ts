import { createHmac } from 'node:crypto'

// Only the guarded local Playwright server knows this intentionally fake credential.
export const testEntryBotID = '9999991234567'
export const testBotToken = `${testEntryBotID}:playwright-fake-bot-credential`
export const testWebhookSecret = 'playwright_only_webhook_secret_at_least_32_chars'
export function signedLaunch(id: number, firstName = 'Browser Candidate', startParam?: string, authDate = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams({ auth_date: String(authDate), user: JSON.stringify({ id, first_name: firstName }) })
  if (startParam) params.set('start_param', startParam)
  params.sort()
  const secret = createHmac('sha256', 'WebAppData').update(testBotToken).digest()
  params.set('hash', createHmac('sha256', secret).update([...params].map(([key, value]) => `${key}=${value}`).join('\n')).digest('hex'))
  return params.toString()
}
