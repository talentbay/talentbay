import { createError, getHeader, getRequestURL } from 'h3'
import type { H3Event } from 'h3'

export function requireSameOrigin(event: H3Event) {
  if (getHeader(event, 'origin') !== getRequestURL(event).origin) {
    throw createError({ statusCode: 403, statusMessage: 'A same-origin request is required' })
  }
}
