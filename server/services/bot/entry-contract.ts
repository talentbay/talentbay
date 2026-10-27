import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

const safeID = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const configSchema = z.object({
  // Nitro deserializes numeric environment values even for string config defaults.
  botID: z.union([safeID.transform(String), z.string().regex(/^[1-9]\d{0,15}$/).refine(value => Number.isSafeInteger(Number(value)))]),
  username: z.string().regex(/^[a-zA-Z0-9_]{5,32}$/),
  secret: z.string().regex(/^[A-Za-z0-9_-]{32,256}$/),
  token: z.string().min(1),
  appOrigin: z.string().url().refine((value) => {
    let url: URL
    try { url = new URL(value) }
    catch { return false }
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash
      && url.pathname === '/' && !url.port && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(url.hostname)
  }),
})
export type BotEntryConfig = z.infer<typeof configSchema>
export function parseBotEntryConfig(input: unknown): BotEntryConfig | null {
  const parsed = configSchema.safeParse(input)
  return parsed.success ? { ...parsed.data, appOrigin: new URL(parsed.data.appOrigin).origin } : null
}
export function verifyBotWebhookSecret(actual: string | undefined, expected: string): boolean {
  if (!actual || actual.length > 256) return false
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(actual), digest(expected))
}

const updateSchema = z.object({
  update_id: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  message: z.object({
    message_id: safeID,
    from: z.object({ id: safeID, is_bot: z.boolean() }).optional(),
    chat: z.object({ id: z.number().int().max(Number.MAX_SAFE_INTEGER).min(-Number.MAX_SAFE_INTEGER), type: z.string().max(32) }),
    text: z.string().max(4096).optional(),
  }).optional(),
})
export type BotWebhookReply = {
  method: 'sendMessage'
  chat_id: number
  text: string
  reply_markup: { inline_keyboard: { text: string; web_app?: { url: string }; url?: string }[][] }
}
export function prepareBotEntry(input: unknown, config: BotEntryConfig): { updateID: number; reply: BotWebhookReply | null } | null {
  const result = updateSchema.safeParse(input)
  if (!result.success) return null
  const { update_id: updateID, message } = result.data
  if (!message || message.chat.type !== 'private' || !message.from || message.from.is_bot
    || message.chat.id !== message.from.id || !message.text) return { updateID, reply: null }
  const match = /^\/([a-z]+)(?:@([a-z0-9_]+))?(?:\s+(.*))?$/i.exec(message.text.trim())
  if (match?.[2] && match[2].toLowerCase() !== config.username.toLowerCase()) return { updateID, reply: null }
  const command = match?.[1]?.toLowerCase()
  const url = (path: string) => new URL(path, config.appOrigin).href
  const appButton = (text: string, path: string) => ({ text, web_app: { url: url(path) } })
  let text: string
  let buttons: BotWebhookReply['reply_markup']['inline_keyboard'] = [[appButton('Open TalentBay', '/jobs')]]
  switch (command) {
    case 'start':
      text = 'Welcome to TalentBay. Browse jobs, estimate relocation costs and manage your profile in the app. Applications go to the TalentBay team, who contact the company to propose your candidacy.'
      break
    case 'jobs':
      text = 'Open TalentBay to browse jobs and compare relocation estimates. Data availability is shown in each estimate.'
      buttons = [[appButton('Browse jobs', '/jobs')]]
      break
    case 'applications':
      text = 'Your applications are available inside TalentBay after sign-in. Private profiles and application status are not shown in this chat.'
      buttons = [[appButton('Your applications', '/applications')]]
      break
    case 'privacy':
      text = 'Read the Privacy Notice before submitting profile details. Do not send CVs, passports or other personal documents to this chat.'
      buttons = [[{ text: 'Privacy Notice', url: url('/privacy') }]]
      break
    case 'help':
      text = 'Use /jobs to browse vacancies, /applications to open your records, and /privacy for the notice. Free-text messages are not monitored as a support inbox.'
      break
    default:
      text = 'This bot opens TalentBay. It does not process messages or documents as support requests. Use /jobs, /applications or /help.'
  }
  return { updateID, reply: { method: 'sendMessage', chat_id: message.chat.id, text, reply_markup: { inline_keyboard: buttons } } }
}
