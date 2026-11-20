import { defineEventHandler, setHeader } from 'h3'
import { isDatabaseConfigured } from '#server/db'

function publicBotUrl(value: unknown) {
  if (typeof value !== 'string') return null
  const username = value.trim().replace(/^@/, '')
  return /^[a-z][a-z0-9_]{1,28}bot$/i.test(username) ? `https://t.me/${username}` : null
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const database = isDatabaseConfigured()
  const google = database && Boolean(config.oauth?.google?.clientId && config.oauth?.google?.clientSecret)
  const github = database && Boolean(config.oauth?.github?.clientId && config.oauth?.github?.clientSecret)
  const telegram = database && Boolean(config.telegramBotToken)
  const botUrl = telegram && !google && !github ? publicBotUrl(config.telegramBotUsername) : null
  setHeader(event, 'cache-control', 'no-store')
  return { google, github, telegram, ...(botUrl ? { telegramBotUrl: botUrl } : {}) }
})
