import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import { getRawBody, getRawBodyWeb } from 'raw-body'

export async function readBoundedJson(event: H3Event, limit = 2 * 1024 * 1024): Promise<unknown> {
  if (getHeader(event, 'content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json'
    || ![undefined, 'identity'].includes(getHeader(event, 'content-encoding')?.trim().toLowerCase())) {
    throw createError({ statusCode: 415, statusMessage: 'Use uncompressed application/json' })
  }
  try {
    const request = event.node.req as typeof event.node.req & { rawBody?: unknown, body?: unknown }
    const supplied = request.rawBody ?? request.body
    let buffer: Buffer
    if (supplied !== undefined && supplied !== null) {
      const value = typeof supplied === 'string' || supplied instanceof Uint8Array ? supplied : JSON.stringify(supplied)
      const bytes = typeof value === 'string' ? Buffer.byteLength(value) : value.byteLength
      if (bytes > limit) throw Object.assign(new Error('limit'), { type: 'entity.too.large' })
      buffer = Buffer.from(value)
    }
    else {
      const options = { limit, length: getHeader(event, 'content-length') }
      const webBody = event.web?.request?.body
      buffer = webBody
        ? await getRawBodyWeb(webBody, options)
        : await getRawBody(request, options)
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer))
  }
  catch (error) {
    event.node.req.resume()
    throw createError({
      statusCode: (error as { type?: string }).type === 'entity.too.large' ? 413 : 400,
      statusMessage: (error as { type?: string }).type === 'entity.too.large' ? 'Import request is too large' : 'Invalid UTF-8 JSON body',
    })
  }
}
