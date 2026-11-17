import { createError, deleteCookie, eventHandler, getCookie, getQuery } from 'h3'
import type { EventHandler } from 'h3'

export function withOAuthCallbackState(handler: EventHandler): EventHandler {
  return eventHandler((event) => {
    const query = getQuery(event)
    // 0.5.30 compares state values; absent query AND cookie otherwise compare equal.
    if (query.code && (
      typeof query.state !== 'string'
      || !query.state
      || !getCookie(event, 'nuxt-auth-state')
    )) {
      deleteCookie(event, 'nuxt-auth-state', { path: '/' })
      throw createError({ statusCode: 400, statusMessage: 'OAuth callback state is required' })
    }

    return handler(event)
  })
}
