import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createEvent } from 'h3'
import { describe, expect, it } from 'vitest'
import { readBoundedJson } from '#server/utils/bounded-json'

function event(chunks: Buffer[], headers: Record<string, string> = {}, supplied?: unknown) {
  const request = Object.assign(Readable.from(chunks), { headers: { 'content-type': 'application/json', ...headers }, method: 'POST', body: supplied })
  return createEvent(request as unknown as IncomingMessage, {} as ServerResponse)
}
describe('bounded import JSON transport', () => {
  it('reads real Node stream chunks without depending on Content-Length', async () => {
    await expect(readBoundedJson(event([Buffer.from('{"csv":'), Buffer.from('"content"}')]), 1024)).resolves.toEqual({ csv: 'content' })
  })
  it('rejects streamed and declared oversize requests with 413', async () => {
    await expect(readBoundedJson(event([Buffer.alloc(100), Buffer.alloc(100)]), 150)).rejects.toMatchObject({ statusCode: 413 })
    await expect(readBoundedJson(event([], { 'content-length': '200' }), 150)).rejects.toMatchObject({ statusCode: 413 })
  })
  it('handles hosting-provider preparsed data but still enforces the byte limit', async () => {
    await expect(readBoundedJson(event([], {}, { csv: 'valid' }), 100)).resolves.toEqual({ csv: 'valid' })
    await expect(readBoundedJson(event([], {}, { csv: 'x'.repeat(1000) }), 100)).rejects.toMatchObject({ statusCode: 413 })
  })
  it('also respects the original content length when a host supplied a small parsed object', async () => {
    await expect(readBoundedJson(event([], { 'content-length': '1025' }, { location: 'london', annualGross: 0 }), 1024)).rejects.toMatchObject({ statusCode: 413 })
  })
  it('rejects invalid JSON/UTF-8 and unsupported content encodings', async () => {
    await expect(readBoundedJson(event([Buffer.from('{invalid')]))).rejects.toMatchObject({ statusCode: 400 })
    await expect(readBoundedJson(event([Buffer.from([0xff])]))).rejects.toMatchObject({ statusCode: 400 })
    await expect(readBoundedJson(event([], { 'content-encoding': 'gzip' }))).rejects.toMatchObject({ statusCode: 415 })
  })
})
