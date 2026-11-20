import { makeVacancyStart } from '#shared/utils/telegram-vacancy-entry'

type BotCapabilities = {
  telegram: boolean
  google: boolean
  github: boolean
  telegramBotUrl?: string
  telegramVacancyEntry?: boolean
}

export function telegramBotEntry(capabilities: BotCapabilities | null | undefined, vacancyId?: number, applicationContext?: string) {
  if (!capabilities?.telegram || capabilities.google || capabilities.github) return null
  const base = capabilities.telegramBotUrl
  if (typeof base !== 'string' || base !== base.trim() || !/^https:\/\/t\.me\/[a-z][a-z0-9_]{1,28}bot$/i.test(base)) return null
  const url = new URL(base)
  const start = capabilities.telegramVacancyEntry === true && typeof vacancyId === 'number'
    ? makeVacancyStart(vacancyId, applicationContext) : null
  if (start) url.searchParams.set('start', start)
  return { href: url.href, opensRole: Boolean(start) }
}
