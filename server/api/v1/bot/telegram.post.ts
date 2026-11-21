import { createError, defineEventHandler, getHeader, setHeader } from 'h3'
import { isDatabaseConfigured } from '#server/db'
import { publicVacancySlugForStart } from '#server/repositories/vacancies'
import { prepareBotEntry, runtimeBotEntryConfig, vacancyEntryReply, verifyBotWebhookSecret } from '#server/services/bot/entry-contract'
import { claimBotEntry } from '#server/services/bot/receipt'
import { readBoundedJson } from '#server/utils/bounded-json'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  const config = runtimeBotEntryConfig(useRuntimeConfig(event))
  if (!config) throw createError({ statusCode: 503, statusMessage: 'Bot entry is not configured' })
  if (!verifyBotWebhookSecret(getHeader(event, 'x-telegram-bot-api-secret-token'), config.secret)) {
    throw createError({ statusCode: 403, statusMessage: 'Webhook authentication failed' })
  }
  const entry = prepareBotEntry(await readBoundedJson(event, 64 * 1024), config)
  if (!entry) throw createError({ statusCode: 400, statusMessage: 'Invalid bot update' })
  if (!entry.reply) return { ok: true }
  if (!isDatabaseConfigured()) throw createError({ statusCode: 503, statusMessage: 'Bot entry is unavailable' })
  try {
    // Resolve before claiming: a transient lookup failure must leave the update retryable.
    let reply = entry.reply
    if (entry.vacancyStart) {
      const { id, payload } = entry.vacancyStart
      const slug = await publicVacancySlugForStart(id, payload)
      reply = vacancyEntryReply(reply.chat_id, config.appOrigin, slug, payload)
    }
    return await claimBotEntry(config.botID, entry.updateID) ? reply : { ok: true }
  }
  catch {
    throw createError({ statusCode: 503, statusMessage: 'Bot entry is unavailable' })
  }
})
