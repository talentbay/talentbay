import { isDatabaseConfigured } from '#server/db'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const database = isDatabaseConfigured()
  setHeader(event, 'cache-control', 'no-store')
  return {
    google: database && Boolean(config.oauth?.google?.clientId && config.oauth?.google?.clientSecret),
    github: database && Boolean(config.oauth?.github?.clientId && config.oauth?.github?.clientSecret),
    telegram: database && Boolean(config.telegramBotToken),
  }
})
